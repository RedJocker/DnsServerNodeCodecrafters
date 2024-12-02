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

    toBuffer() {
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
}


/* 

    Name: A domain name, represented as a sequence of "labels" (more on this below)
    Type: 2-byte int; the type of record (1 for an A record, 5 for a CNAME record etc., full list here)
    Class: 2-byte int; usually set to 1 (full list here)
*/

export { Question };