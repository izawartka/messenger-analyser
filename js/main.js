import { Analyser } from "./analyser.js";
import { Tabs } from "./tabs.js"

const tabNames = [
    'upload',
    'msgper',
    'msgtot',
    'wordstot',
];

const tabs = new Tabs(tabNames);

tabs.addTabEvent('msgper', () => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    analyser.applyFilters();
    analyser.messagesPer.draw();
});

tabs.addTabEvent('msgtot', () => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    analyser.applyFilters();
    analyser.messagesTotal.draw();
});

tabs.addTabEvent('wordstot', () => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    analyser.applyFilters();
    analyser.wordsTotal.draw();
});

const elementsIDs = [
    'zipFile',
    'zipFileSend',
    'status',
    'msgpercanv',
    'msgtotalcanv',
    'msgperinfo',
    'filter_r_sel',
    'filter_r_top',
    'filter_r_ng',
    'filter_r_all',
    'filter_r_form',
    'filter_s',
    'filter_s_byname',
    'filter_s_selbyname',
    'filter_s_count',
    'filter_s_form',
    'recolor',
    'msgtotinfo',
    'wordstotinfo',
    'wordstotinfo_up',
    'wordstotinfo_down',
];

let elements = {};
elementsIDs.forEach(id => {
    elements[id] = document.getElementById(id);
});

let analyser;

elements.zipFileSend.onclick = () => {
    if(elements.zipFile.files.length == 0) return;
    analyser = new Analyser(elements.zipFile.files[0], elements); 
};

setInterval(() => {
    if(!analyser) return;
    elements.status.innerHTML = analyser.status;
}, 20);

elements.msgpercanv.onmousemove = (e) => {
    if(analyser)
        analyser.messagesPer.graphInfo(e, false);
}

elements.msgtotalcanv.onmousemove = (e) => {
    if(analyser)
        analyser.messagesPer.graphInfo(e, true);
}

elements.filter_s_form.onsubmit = (e) => {
    e.preventDefault();
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    let options = Array.from(elements.filter_s.options);
    options.forEach(option => {
        if(option.innerHTML.includes(elements.filter_s_byname.value)) {
            option.selected = true;
        }
    });

    analyser.onFiltersChange();
}

elements.filter_s_byname.oninput = (e) => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    let options = Array.from(elements.filter_s.options);
    options.forEach(option => {
        if(elements.filter_s_byname.value.length == 0) {
            option.style.display = '';
            return;
        }

        let display = option.innerHTML.includes(elements.filter_s_byname.value) ? '' : 'none';
        option.style.display = display;
    });
}

elements.filter_s.onchange = (e) => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    elements.filter_r_sel.checked = true;

    analyser.onFiltersChange();
}

elements.filter_r_form.onsubmit = (e) => {
    e.preventDefault();
}

elements.filter_r_form.filter_r.forEach((radio) => {
    radio.onchange = (e) => {
        if(!analyser) return;
        if(!analyser.threadsReady) return;

        analyser.onFiltersChange();
    }
});

elements.recolor.onclick = (e) => {
    if(!analyser) return;
    if(!analyser.threadsReady) return;

    analyser.messagesPer.changeColors();
    analyser.messagesPer.draw();
}