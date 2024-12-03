import { Answer } from "./answer.js";

class Question {
    /**
    * Creates a Question instance.
    * @param {string} name - A domain name.
    * @param {number} type - The type of record.
    */
    constructor(
        name,
        type,
    ) {
        this.name = name;
        this.type = type;
        this.questionClass = 1;  
    }

    // Method to represent the object as a string
    toString() {
        return JSON.stringify(this, null, 2);
    }

    toBuffer = () => {
        const labels = this.name.split(".").map(l => {
            return {
                len: l.length, 
                label: l
            }})
        const size = labels.reduce((acc, cur) => acc + cur.len + 1, 0)
        const buffer = Buffer.alloc(size + 1 + 4)
        let offset = 0;
        for (const {label, len} of labels) {
            buffer.writeUInt8(len, offset)
            offset++
            buffer.write(label, offset)
            offset += len
        }
        buffer.writeInt8(0, offset++)
        buffer.writeInt16BE(this.type, offset)
        buffer.writeInt16BE(this.questionClass, offset + 2)
        return buffer;
    }

    static _isCompressedLabel = (maybeCompressedFlag) => maybeCompressedFlag == 0b1100_0000

    /**
    * Parse a buffer, starting at offset, into a Question instance.
    * @param {Buffer} buffer - A buffer.
    * @param {number} offset - Where to start reading buffer to create Question instance.
    * @returns {{question: Question, len: number}} - An object containig key question with the question that was
    *  parsed from buffer and len the size that was read, so that it can be added to offset if needed 
    */
    static fromBuffer(buffer, offset) {
        let {name, len} = this._readName(buffer, offset);
        offset += len
        const type = buffer.readInt16BE(offset)
        const questionClass = buffer.readInt16BE(offset + 2) 
        len += 4
        const question = new Question(name, type)
        return {question, len}
      }

    /**
    * Parse a buffer, starting at offset, into a name string.
    * @param {Buffer} buffer - A buffer.
    * @param {number} offset - Where to start reading buffer to create a name string.
    * @returns {{name: string, len: number}} - An object containig key name with the name that was
    *  parsed from buffer and len the size that was read, so that it can be added to offset if needed 
    */
      static _readName (buffer, offset) {
        let len = 0;
        let labels = []
        while (true) {
            let maybeCompressedFlag = buffer.readUInt8(offset) & 0b1100_0000
            if (this._isCompressedLabel(maybeCompressedFlag)) {
                const pointerOffset = buffer.readUInt16BE(offset) & 0b0011_1111_1111_1111
                const { name: pointerName, len: pointerLen } = this._readName(buffer, pointerOffset)
                const uncompressedName = labels.join('.') + "." + pointerName
                const compressedLen = len + 2
                return {name: uncompressedName, len: compressedLen}
            }
            let size = buffer.readUInt8(offset++)
            len += size + 1;
            if (size == 0) {
                break ;
            }
            const label = buffer.subarray(offset, offset + size).toString("ascii")
            labels.push(label)
            offset += size;
        }
        const name = labels.join('.')
        return {name, len}
      }

      toAnswer = () => {
        return new Answer(this.name, this.type, this.domainToIp(this.name))
      }

      domainToIp = (name) => "8.8.8.8"   
      
}


/* 

    Name: A domain name, represented as a sequence of "labels" (more on this below)
    Type: 2-byte int; the type of record (1 for an A record, 5 for a CNAME record etc., full list here)
    Class: 2-byte int; usually set to 1 (full list here)
*/

export { Question };