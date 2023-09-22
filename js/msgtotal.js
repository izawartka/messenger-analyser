export class MessagesTotal {
    constructor(analyser) {
        this.analyser = analyser;
        this.messageCounts = [];
    }

    draw() {
        let fullName = this.analyser.info.FULL_NAME[0];
        this.messageCounts = [];
        this.totalMessagesCount = 0;
        this.totalCharsCount = 0;

        for (const [threadName, messages] of Object.entries(this.analyser.filteredMessages)) {
            let counts = {
                threadName,
                outcoming: 0,
                incoming: 0,
                total: messages.length,
                outcoming_chars: 0,
                incoming_chars: 0,
                total_chars: 0,
            };

            this.totalMessagesCount += messages.length;

            messages.forEach(message => {
                let charsCount = 0;
                if(message.content) charsCount = message.content.length;

                if(message.sender_name == fullName) {
                    counts.outcoming++;
                    counts.outcoming_chars += charsCount;
                }
                else {     
                    counts.incoming++;
                    counts.incoming_chars += charsCount;
                }

                counts.total_chars += charsCount;
                this.totalCharsCount += charsCount;
            });

            this.messageCounts.push(counts);
        }

        function compare(a, b) {
            if ( a.total < b.total ){
                return 1;
            }
            if ( a.total > b.total ){
                return -1;
            }
            return 0;
        }

        this.messageCounts.sort(compare);

        let html = `<table>
            <tr>
                <th rowspan="2">Title</th>
                <th colspan="5">Messages count</th>
                <th rowspan="2"> </th>
                <th colspan="5">Characters count</th>
            </tr>
            <tr>
                <th>Outcoming</th>
                <th></th>
                <th>Incoming</th>
                <th>Total</th>
                <th>% of all</th>
                <th>Outcoming</th>
                <th></th>
                <th>Incoming</th>
                <th>Total</th>
                <th>% of all</th>
            </tr>`;

        this.messageCounts.forEach(counts => {
            let symbol = counts.outcoming > counts.incoming ? '>' : (counts.outcoming < counts.incoming ? '<' : '=');
            let symbol_chars = counts.outcoming_chars > counts.incoming_chars ? '>' : (counts.outcoming_chars < counts.incoming_chars ? '<' : '=');
            let percent = Math.round(1000 * counts.total / this.totalMessagesCount)/10;
            let percent_chars = Math.round(1000 * counts.total_chars / this.totalCharsCount)/10;
            if(percent < 0.1) percent = '< 0.1';
            if(percent_chars < 0.1) percent_chars = '< 0.1';

            html += `
                <tr>
                    <td>${this.analyser.title[counts.threadName]}</td>
                    <td>${counts.outcoming.toLocaleString()}</td>
                    <td>${symbol}</td>
                    <td>${counts.incoming.toLocaleString()}</td>
                    <td>${counts.total.toLocaleString()}</td>
                    <td>${percent}%</td>
                    <td></td>
                    <td>${counts.outcoming_chars.toLocaleString()}</td>
                    <td>${symbol_chars}</td>
                    <td>${counts.incoming_chars.toLocaleString()}</td>
                    <td>${counts.total_chars.toLocaleString()}</td>
                    <td>${percent_chars}%</td>
                </tr>
            `;
        });      

        html += '</table>';
        this.analyser.elements.msgtotinfo.innerHTML = html;
    }
}