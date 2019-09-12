const axios = require('axios')
const querystring = require('querystring');
const doctorConfig = {
    Lu: {
        unit_id: 22,
        dep_id: 120,
        doc_id: 175,
        doctor_id: 175,
        cid: 23
    },
    Huang: {
        unit_id: 21,
        dep_id: 556,
        doc_id: 21840,
        doctor_id: 21840,
        cid: 23
    }
}

const timeGap = 3 * 60 * 1000;

function weekendFilter(v) {
    let day = new Date(v.day).getDay()
    let isWeekEnd = [0, 6].includes(day);
    return isWeekEnd;
}

function availableFilter(v) {
    let isAvailable = v.sch.some(v=>v.y_state === '1');
    return isAvailable;
}

async function getAvailableList() {
    let sch = await axios.get(`https://weixin.91160.com/doctor/oldschedule.html?`+ querystring.stringify(doctorConfig.Lu)).then(v=>v.data.data);

    let list = sch.schList.reduce((acc, v) => acc.concat(v))

    return list
        // .filter(weekendFilter)
        .filter(availableFilter)

}

async function getDoctorInfo() {
    return axios.get('https://weixin.91160.com/doctor/getDocInfo.html?to=&to_me_catid=&to_me_from=&wecity_open_id=&source=&type=guahao&' + querystring.stringify(doctorConfig.Lu)).then(v=>v.data.data);
}

async function announce(content) {
    axios.get(`http://localhost:5700/send_private_msg?user_id=617822642&message=${encodeURIComponent(content)}`)
    // axios.get(`http://localhost:5700/send_group_msg?group_id=569360687&message=${encodeURIComponent(content)}`)
    return axios.post('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=021bc5b5-1e3c-4f52-a951-d3a77806ab47', {
        msgtype: 'text',
        text: {
            content
        }
    }).then(v=>v.data)
}

async function start() {
    console.log('action time', new Date().toLocaleString())

    let list = await getAvailableList();
    if (list.length) {
        let content = await formatList(list);
        let announceResult = await announce(content)

        // console.log('result', announceResult)
    }
}

async function formatList(list) {
    let doctor = await getDoctorInfo();
    return `${doctor.doctor_name}医生有号啦：
${list.map(v=>v.day + ' ' + v.week).join('\n')}`
}

async function sleep(ms) {
    return new Promise((res)=>{
        setTimeout(res, ms);
    })
}

async function init() {
    start();
    while(true) {
        await sleep(timeGap);
        start()
    }
}

init();