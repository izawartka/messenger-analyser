export class Tabs {
    constructor(tabNames) {
        this.tabNames = tabNames;
        this.tabButtons = {};
        this.tabElements = {};
        this.tabEvents = {};
        this.currentTabName = '';

        this.tabNames.forEach(tabName => {
            this.tabButtons[tabName] = document.getElementById(`tab_${tabName}_btn`);
            this.tabElements[tabName] = document.getElementById(`tab_${tabName}`);

            this.tabButtons[tabName].onclick = (e) => {
                this.showTab(tabName);
            }
        });

        this.showTab(this.tabNames[0]);
    }

    showTab(tabName) {
        if(!this.tabElements[tabName]) return;
        if(this.currentTabName) {
            this.tabButtons[this.currentTabName].classList.remove('activeTabBtn');
            this.tabElements[this.currentTabName].classList.remove('activeTab');
        }
        
        this.currentTabName = tabName;

        this.tabButtons[this.currentTabName].classList.add('activeTabBtn');
        this.tabElements[this.currentTabName].classList.add('activeTab');
        
        setTimeout(() => {
            if(this.tabEvents[tabName]) {
                this.tabEvents[tabName].call();
            }
        }, 30);
        
    }

    addTabEvent(tabName, func) {
        this.tabEvents[tabName] = func;
    }
}