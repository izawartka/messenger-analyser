const WORDS_PER_PAGE = 50;

export class WordsTotal {
    constructor(analyser) {
        this.analyser = analyser;
        this.wordsCount = [];
        this.ready = false;
        this.totalWordsCount = 0;
        this.currentPage = 0;
        this.filtersChanged = true;
    }
    
    drawPage(page) {
        if(page < 0) return;
        if(page * WORDS_PER_PAGE >= this.wordsCount.length) return;
        if(!this.ready) return;

        let html = '';
        let start = page * WORDS_PER_PAGE;
        let end = Math.min(start + WORDS_PER_PAGE, this.wordsCount.length);

        for(let i = start; i < end; i++) {
            let counts = this.wordsCount[i];
            let ratio = Math.round(1000 * counts.outcoming / counts.incoming)/1000;
            if(ratio == 0 || ratio == Infinity) ratio = '-';
            let permile = Math.round(10000 * counts.total / this.totalWordsCount)/10;
            if(permile < 0.1) permile = '< 0.1';

            html += `
                <tr>
                    <td>${counts.word}</td>
                    <td>${counts.total.toLocaleString()}</td>
                    <td>${counts.outcoming.toLocaleString()}</td>
                    <td>${counts.incoming.toLocaleString()}</td>
                    <td>${ratio}</td>
                    <td>${permile}‰</td>
                </tr>
            `;
        }     

        this.analyser.elements.wordstotinfo.innerHTML = html;

        this.currentPage = page;

        let isFirstPage = page == 0;
        let isLastPage = end == this.wordsCount.length;

        this.analyser.elements.wordstotinfo_up.className = isFirstPage ? 'graytdbutton' : 'tdbutton';
        this.analyser.elements.wordstotinfo_down.className = isLastPage ? 'graytdbutton' : 'tdbutton';
    }

    draw() {
        if(!this.filtersChanged) {
            this.drawPage(0);
            return;
        }

        this.ready = false;
        let fullName = this.analyser.info.FULL_NAME[0];

        this.wordsCount = [];
        this.totalWordsCount = 0;
        let wordsCountDict = {};
        
        for (const messages of Object.values(this.analyser.filteredMessages)) {
            for(let i = 0; i < messages.length; i++) {
                if(!messages[i].content) continue;

                let words = messages[i].content.split(/(?:,| |:|\(|\)\\|\/|\.)+/);
                for(let j = 0; j < words.length; j++) {
                    let word = words[j].toLowerCase();
                    if(word.length == 0) continue;
                    if(word.length > 32) continue;

                    if(!wordsCountDict[word]) {
                        wordsCountDict[word] = {
                            word,
                            outcoming: 0,
                            incoming: 0,
                            total: 0,
                        };
                    }

                    let side = messages[i].sender_name == fullName ? 'outcoming' : 'incoming';
                    wordsCountDict[word][side]++;
                    wordsCountDict[word].total++;
                    this.totalWordsCount++;
                }
            }
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

        this.wordsCount = Object.values(wordsCountDict);
        this.wordsCount.sort(compare);

        this.ready = true;
        this.filtersChanged = false;
        this.drawPage(0);

        this.analyser.elements.wordstotinfo_down.onclick = (e) => {
            this.drawPage(this.currentPage + 1);
        }

        this.analyser.elements.wordstotinfo_up.onclick = (e) => {
            this.drawPage(this.currentPage - 1);
        }
    }
}