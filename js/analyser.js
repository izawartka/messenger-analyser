import { MessagesPer } from './msgper.js';
import { MessagesTotal } from './msgtotal.js';

export class Analyser {
    constructor(zipFile, elements) {
        this.elements = elements;
        this.messagingStart = Number.MAX_VALUE;
        this.messagingEnd = 0;
        this.messages = {};
        this.filteredMessages = {};
        this.title = {};
        this.isGroup = {};
        this.threadsReady = false;
        this.topThreads = [];
        this.messagesPer = new MessagesPer(this);
        this.messagesTotal = new MessagesTotal(this);
        this.info;
        this.infoReady = false;

        this.status = "reading zip file...";
        var jszip = new JSZip();
        jszip.loadAsync(zipFile)
            .then((zipContent) => {
                this.readInfoFile(zipContent);
                this.readThreads(zipContent);
            }, (e) => {
                this.status = "invalid zip file! Couldn't read";
                throw e;
            });
    }

    readInfoFile(zipContent) {
        this.status = 'reading info file...';
        let infoFile = zipContent.file('your_activity_across_facebook/messages/autofill_information.json');
        if(infoFile == null) {
            this.status = 'invalid zip file! autofill_information.json not found';
            return;
        }

        infoFile.async("string")
            .then((content) => {
                this.info = JSON.parse(content).autofill_information_v2;
                this.infoReady = true;
            });
    }

    readThreads(zipContent) {
        this.status = "reading threads...";
        let leftToRead = 0;
        let startedReading = false;
        let threadFiles = zipContent.folder('your_activity_across_facebook/messages').file(/message_\d+\.json/);
        if(threadFiles.length == 0) {
            this.status = 'invalid zip file! No message files found';
            return;
        }
        threadFiles.forEach((file) => {
            let threadName = file.name.split('/').at(-2);
            this.messages[threadName] = [];
            leftToRead++;
            startedReading = true;

            file.async("string")
            .then((content) => {
                this.status = `reading messages... (${threadName})`;
                let part = JSON.parse(content);
                this.messages[threadName].push(...part.messages);
                this.title[threadName] = part.title || threadName;
                this.isGroup[threadName] = part.joinable_mode != undefined;
                Object.values(part.messages).forEach(message => {
                    if(message.timestamp_ms < this.messagingStart) this.messagingStart = message.timestamp_ms;
                    if(message.timestamp_ms > this.messagingEnd) this.messagingEnd = message.timestamp_ms;
                });
                leftToRead--;
            });
        });

        let that = this;
        waitForRead();
        function waitForRead(){
            if(leftToRead == 0 && startedReading){
                that.threadsReady = true;
                that.status = "ready!";
                that.updateUIonLoad();
            }
            else{
                setTimeout(waitForRead, 100);
            }
        }
    }

    getTop(number, skipGroups) {
        function compare(a, b) {
            if ( a.messages.length < b.messages.length ){
                return 1;
            }
            if ( a.messages.length > b.messages.length ){
                return -1;
            }
            return 0;
        }
        
        let sorted = [];

        for (const [threadName, messages] of Object.entries(this.messages)) {
            if(skipGroups && this.isGroup[threadName]) continue;
            sorted.push({threadName, messages});
        }

        sorted.sort(compare);
        this.topThreads = sorted.slice(0, number);
    }

    applyFilters() {
        this.threadsReady = false;

        this.filteredMessages = {};
        if(this.elements.filter_r_top.checked) this.getTop(20, true);
        for (const [threadName, messages] of Object.entries(this.messages)) {
            if(this.checkIfFilteredOut(threadName)) continue;

            this.filteredMessages[threadName] = messages;
        }

        this.threadsReady = true;
    }

    updateSelectedThreadsCount(selectRadio = false) {
        this.elements.filter_s_count.innerHTML = `${this.elements.filter_s.selectedOptions.length}/${this.elements.filter_s.options.length}`;

        if(selectRadio) this.elements.filter_r_sel.checked = true;
    }

    updateUIonLoad() {
        let html = '';
        for (const [threadName, title] of Object.entries(this.title)) {
            html += `<option value="${threadName}">${title}</option>`;
        }
        this.elements.filter_s.innerHTML = html;

        this.updateSelectedThreadsCount();
    }

    checkIfFilteredOut(threadName) {
        if(this.isGroup[threadName] && this.elements.filter_r_ng.checked) return 1;
        if(this.elements.filter_r_sel.checked) {
            let selected = false;
            Array.from(this.elements.filter_s.selectedOptions).forEach(option => {
                if(option.value == threadName) selected = true;
            });
            if(!selected) return 1;
        }
        if(this.elements.filter_r_top.checked) {
            let selected = false;
            this.topThreads.forEach(thread => {
                if(thread.threadName == threadName) selected = true; 
            })
            if(!selected) return 1;
        }
        return 0;
    }
}