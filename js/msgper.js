const MSGPER_MULTIPLIER = 7*24*60*60*1000;

export class MessagesPer {
    constructor(analyser) {
        this.analyser = analyser;
        this.messagesPer = {};
        this.messagesTotalPer = {};
        this.threadColor = {};
        this.startSector = Number.MAX_VALUE;
        this.endSector = 0;
        this.messagesPerMax = 0;
        this.messagesTotal = 0;
        this.messagesPerImgReady = false;
        this.messagesPerImage;
        this.messagesTotalPerImage;
    }

    changeColors() {
        Object.keys(this.analyser.messages).forEach(threadName => {
            this.threadColor[threadName] = `hsl(${Math.floor(Math.random()*360)}, ${25+Math.floor(Math.random()*50)}%, ${25+Math.floor(Math.random()*50)}%)`;
        });
    }

    draw() {
        if(!this.analyser.threadsReady) return;
        if(Object.keys(this.threadColor).length == 0) 
            this.changeColors();

        this.messagesPerImgReady = false;
        this.startSector = Math.floor(this.analyser.messagingStart / MSGPER_MULTIPLIER);
        this.endSector = Math.floor(this.analyser.messagingEnd / MSGPER_MULTIPLIER);
        this.messagesPerMax = 0;
        this.messagesPer = {};
        this.messagesPerImage = undefined;
        this.messagesTotal = 0;
        this.messagesTotalPer = {};
        this.messagesTotalPerImage = undefined;
        
        // count new messages per week
        for (const [threadName, messages] of Object.entries(this.analyser.filteredMessages)) {
            messages.forEach(message => {
                let timeSector = Math.floor(message.timestamp_ms / MSGPER_MULTIPLIER);
                if(!this.messagesPer[timeSector]) this.messagesPer[timeSector] = {};
                this.messagesPer[timeSector][threadName] = ~~this.messagesPer[timeSector][threadName] + 1;
                this.messagesTotal++;
            });
        }

        // find max new messages per week
        Object.values(this.messagesPer).forEach(entry => {
            let count = 0;

            Object.keys(entry).forEach(threadName => {
                count += entry[threadName];
            })

            if(count > this.messagesPerMax) this.messagesPerMax = count;
        });

        // count total messages count per week
        let lastTotal = {};
        for(let i = this.startSector; i <= this.endSector; i++) {
            let nowTotal = Object.assign({}, lastTotal);
            if(this.messagesPer[i]) {
                for (const [threadName, messages] of Object.entries(this.messagesPer[i])) {
                    nowTotal[threadName] = ~~nowTotal[threadName] + messages;
                };
            }
            this.messagesTotalPer[i] = nowTotal;
            lastTotal = nowTotal;
        }
        
        // draw graphs
        this.drawMessagesPer();
        this.drawMessagesTotal();
        this.messagesPerImgReady = true;
    }

    drawMessagesPer() {
        let canv = this.analyser.elements.msgpercanv;
        let xScale = this.perXscale = canv.offsetWidth / (this.endSector-this.startSector+1);
        let yScale = canv.offsetHeight / (this.messagesPerMax+1);
        let cw = canv.width = canv.offsetWidth;
        let ch = canv.height = canv.offsetHeight;
        let ctx = canv.getContext('2d');
        
        for(let i = this.startSector; i <= this.endSector; i++) {
            if(!this.messagesPer[i]) continue;
            let occupiedY = 0;
            let relX = xScale*(i-this.startSector);
            for (const [threadName, messages] of Object.entries(this.messagesPer[i])) {
                ctx.fillStyle = this.threadColor[threadName];
                ctx.fillRect(relX, ch-yScale*(occupiedY+messages), xScale, yScale*messages);
                occupiedY+=messages;
            }
        }

        this.drawTimeLines(canv, xScale);
        this.messagesPerImage = new Image();
        this.messagesPerImage.src = canv.toDataURL("image/png");
    }

    drawMessagesTotal() {
        let canv = this.analyser.elements.msgtotalcanv;
        let xScale = this.totalXscale = canv.offsetWidth / (this.endSector-this.startSector+1);
        let yScale = canv.offsetHeight / (this.messagesTotal+1);
        let cw = canv.width = canv.offsetWidth;
        let ch = canv.height = canv.offsetHeight;
        let ctx = canv.getContext('2d');
        
        for(let i = this.startSector; i <= this.endSector; i++) {
            if(!this.messagesTotalPer[i]) continue;
            let occupiedY = 0;
            let relX = xScale*(i-this.startSector);
            for (const [threadName, messages] of Object.entries(this.messagesTotalPer[i])) {
                ctx.fillStyle = this.threadColor[threadName];
                ctx.fillRect(relX, ch-yScale*(occupiedY+messages), xScale, yScale*messages);
                occupiedY+=messages;
            }
        }
        
        this.drawTimeLines(canv, xScale);
        this.messagesTotalPerImage = new Image();
        this.messagesTotalPerImage.src = canv.toDataURL("image/png");
    }

    drawTimeLines(canvas, xScale) {
        let ctx = canvas.getContext('2d');

        let lastMonth = 0;
        let lastYear = 0;

        ctx.strokeStyle = '#888';
        ctx.fillStyle = '#888';

        for(let i = this.startSector; i <= this.endSector; i++) {
            let relX = xScale*(i-this.startSector);

            let currDate = new Date(i*MSGPER_MULTIPLIER);
            let currMonth = currDate.getMonth();
            let currYear = currDate.getFullYear();

            let lw = 0;

            if(currMonth != lastMonth) lw = 0.5;
            if(currYear != lastYear) lw = 1;

            lastMonth = currMonth;
            lastYear = currYear;

            if(lw == 0 || i == this.startSector) continue;
            
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(relX, 0);
            ctx.lineTo(relX, canvas.height);
            ctx.stroke();

            if(lw != 1) continue;

            ctx.fillText(currYear, relX+4, 24);
        }
    }

    graphInfo(e, sortByTotal) {
        if(!this.messagesPerImgReady) return;

        let totalCanvas = this.analyser.elements.msgtotalcanv;
        let totalCtx = totalCanvas.getContext('2d');
        let perCanvas = this.analyser.elements.msgpercanv;
        let perCtx = perCanvas.getContext('2d')
        totalCtx.clearRect(0,0,totalCanvas.width,totalCanvas.height);
        totalCtx.drawImage(this.messagesTotalPerImage, 0, 0);
        perCtx.clearRect(0,0,perCanvas.width,perCanvas.height);
        perCtx.drawImage(this.messagesPerImage, 0, 0);

        var rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let index = Math.floor(this.startSector + x/this.totalXscale);
        let date = new Date(index * MSGPER_MULTIPLIER);
        let dateEnd = new Date(((index+1)*7-1)*24*60*60*1000); ///
        let html = date.toLocaleDateString() + ' - ' + dateEnd.toLocaleDateString();

        let xSector = Math.floor(x/this.totalXscale)*this.totalXscale;
        totalCtx.fillStyle = '#8888';
        totalCtx.fillRect(xSector,0,this.totalXscale,totalCanvas.height);
        perCtx.fillStyle = '#8888';
        perCtx.fillRect(xSector,0,this.totalXscale,perCanvas.height);

        if(!this.messagesTotalPer[index]) {    
            this.analyser.elements.msgperinfo.innerHTML = html;
            return;
        } 

        html += '<table><tr><th>Color</th><th>Title</th><th>Messages</th><th>Total messages then</th></tr>';

        let sorted = [];
        Object.keys(this.messagesTotalPer[index]).forEach(threadName => {
            let messages = this.messagesPer[index] ? ~~this.messagesPer[index][threadName] : 0;
            sorted.push({
                threadName, 
                messages,
                totalMessages: ~~this.messagesTotalPer[index][threadName]
            });
        });

        let comparePer = (a, b) => {
            if ( a.messages < b.messages ) return 1;
            if ( a.messages > b.messages ) return -1;
            return 0;
        }

        let compareTotal = (a, b) => {
            if ( a.totalMessages < b.totalMessages ) return 1;
            if ( a.totalMessages > b.totalMessages ) return -1;
            return 0;
        }

        let compareMain = sortByTotal ? compareTotal : comparePer;
        let compareSecd = sortByTotal ? comparePer : compareTotal;

        let compare = (a, b) => {
            let s = compareMain(a, b);
            if(!s) s = compareSecd(a, b);
            return s;
        }

        sorted.sort(compare);

        sorted.forEach(thread => { 
            let name = decodeURIComponent(this.analyser.title[thread.threadName]);
            html += `<tr>
                <td style="width=100px; background-color: ${this.threadColor[thread.threadName]}"></td>
                <td>${name}</td>
                <td>${thread.messages}</td>
                <td>${thread.totalMessages}</td>
            </tr>`;
        });

        html += '</table>'

        this.analyser.elements.msgperinfo.innerHTML = html;
    }
}