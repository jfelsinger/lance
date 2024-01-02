import Utils from './../lib/Utils';
import BaseTypes from './BaseTypes';
import { Serializer } from './Serializer';

export type SerializableOptions = {
    dataBuffer?: ArrayBufferLike;
    bufferOffset?: number;
    dry?: boolean;
};

export class Serializable {
    classId!: number;
    netScheme!: string;

    /**
     *  Class can be serialized using either:
     * - a class based netScheme
     * - an instance based netScheme
     * - completely dynamically (not implemented yet)
     *
     * @param {Object} serializer - Serializer instance
     * @param {Object} [options] - Options object
     * @param {Object} options.dataBuffer [optional] - Data buffer to write to. If null a new data buffer will be created
     * @param {Number} options.bufferOffset [optional] - The buffer data offset to start writing at. Default: 0
     * @param {String} options.dry [optional] - Does not actually write to the buffer (useful to gather serializeable size)
     * @return {Object} the serialized object.  Contains attributes: dataBuffer - buffer which contains the serialized data;  bufferOffset - offset where the serialized data starts.
     */
    serialize(serializer: Serializer, options?: SerializableOptions): { dataBuffer: ArrayBufferLike, bufferOffset: number } {
        options = Object.assign({
            bufferOffset: 0
        }, options);

        let netScheme;
        let dataBuffer!: ArrayBufferLike;
        let dataView: DataView;
        let classId = 0;
        let bufferOffset = options.bufferOffset ?? 0;
        let localBufferOffset = 0; // used for counting the bufferOffset

        // instance classId
        if (this.classId) {
            classId = this.classId;
        } else {
            classId = Utils.hashStr(this.constructor.name);
        }

        // instance netScheme
        if (this.netScheme) {
            netScheme = this.netScheme;
        } else if ((this.constructor as any).netScheme) {
            netScheme = (this.constructor as any).netScheme;
        } else {
            // todo define behaviour when a netScheme is undefined
            console.warn('no netScheme defined! This will result in awful performance');
        }

        // TODO: currently we serialize every node twice, once to calculate the size
        //       of the buffers and once to write them out.  This can be reduced to
        //       a single pass by starting with a large (and static) ArrayBuffer and
        //       recursively building it up.
        // buffer has one Uint8Array for class id, then payload
        if (options.dataBuffer == null && options.dry != true) {
            let bufferSize = this.serialize(serializer, { dry: true }).bufferOffset;
            dataBuffer = new ArrayBuffer(bufferSize);
        } else if (options.dataBuffer) {
            dataBuffer = options.dataBuffer;
        }

        if (options.dry != true) {
            dataView = new DataView(dataBuffer!);
            // first set the id of the class, so that the deserializer can fetch information about it
            dataView.setUint8(bufferOffset + localBufferOffset, classId);
        }

        // advance the offset counter
        localBufferOffset += Uint8Array.BYTES_PER_ELEMENT;

        if (netScheme) {
            for (let property in (netScheme).sort() as (keyof this)[]) {
                const propertyValue = (this)[property as keyof this];

                // write the property to buffer
                if (options.dry != true) {
                    serializer.writeDataView(dataView!, (this as any)[property], bufferOffset + localBufferOffset, netScheme[property]);
                }

                if (netScheme[property].type === BaseTypes.TYPES.STRING) {
                    // derive the size of the string
                    localBufferOffset += Uint16Array.BYTES_PER_ELEMENT;
                    if (propertyValue !== null && propertyValue !== undefined)
                        localBufferOffset += (propertyValue as any).length * Uint16Array.BYTES_PER_ELEMENT;
                } else if (netScheme[property].type === BaseTypes.TYPES.CLASSINSTANCE) {
                    // derive the size of the included class
                    let objectInstanceBufferOffset = (propertyValue as any).serialize(serializer, { dry: true }).bufferOffset;
                    localBufferOffset += objectInstanceBufferOffset;
                } else if (netScheme[property].type === BaseTypes.TYPES.LIST) {
                    // derive the size of the list
                    // list starts with number of elements
                    localBufferOffset += Uint16Array.BYTES_PER_ELEMENT;

                    for (let item of propertyValue as any) {
                        // todo inelegant, currently doesn't support list of lists
                        if (netScheme[property].itemType === BaseTypes.TYPES.CLASSINSTANCE) {
                            let listBufferOffset = item.serialize(serializer, { dry: true }).bufferOffset;
                            localBufferOffset += listBufferOffset;
                        } else if (netScheme[property].itemType === BaseTypes.TYPES.STRING) {
                            // size includes string length plus double-byte characters
                            localBufferOffset += Uint16Array.BYTES_PER_ELEMENT * (1 + item.length);
                        } else {
                            localBufferOffset += serializer.getTypeByteSize(netScheme[property].itemType);
                        }
                    }
                } else {
                    // advance offset
                    localBufferOffset += serializer.getTypeByteSize(netScheme[property].type);
                }

            }
        } else {
            // TODO no netScheme, dynamic class
        }

        return { dataBuffer, bufferOffset: localBufferOffset };
    }

    // build a clone of this object with pruned strings (if necessary)
    prunedStringsClone(this: any, serializer: Serializer, prevObject: any) {

        if (!prevObject) return this;
        prevObject = serializer.deserialize(prevObject).obj;

        // get list of string properties which changed
        let netScheme = (this.constructor as any).netScheme;
        let isString = (p: string) => netScheme[p].type === BaseTypes.TYPES.STRING;
        let hasChanged = (p: string) => prevObject[p] !== this[p];
        let changedStrings = Object.keys(netScheme).filter(isString).filter(hasChanged);
        if (changedStrings.length == 0) return this;

        // build a clone with pruned strings
        let prunedCopy = new this.constructor(null, { id: null });
        for (let p in (netScheme))
            prunedCopy[p] = changedStrings.indexOf(p) < 0 ? this[p] : null;

        return prunedCopy;
    }

    syncTo(this: any, other: any) {
        let netScheme = this.constructor.netScheme;
        for (let p in (netScheme)) {

            // ignore classes and lists
            if (netScheme[p].type === BaseTypes.TYPES.LIST || netScheme[p].type === BaseTypes.TYPES.CLASSINSTANCE)
                continue;

            // strings might be pruned
            if (netScheme[p].type === BaseTypes.TYPES.STRING) {
                if (typeof other[p] === 'string') this[p] = other[p];
                continue;
            }

            // all other values are copied
            this[p] = other[p];
        }
    }

}

export default Serializable;
