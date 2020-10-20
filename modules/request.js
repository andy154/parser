const request = require('request');
const rp = require('request-promise');
const {JSDOM} = require('jsdom');
const innerText = require('innertext');
const config = require('../config.json');

async function getProductsList(excel, host, category, page){

  if(!page) page = category.path;
  console.log(`Обработка ${page}`);

  let sheet = excel.book.getWorksheet(category.name);
  if(!sheet){
    sheet = excel.book.addWorksheet(category.name);
    sheet.addRow(['Наименование', 'Стоимость', 'Количество']);
  }

  const html = await rp(host + page);

  const dom = new JSDOM(html);
  const body = dom.window.document.body;

  nextPage = body.getElementsByClassName('page-next')[0];
  if(nextPage) nextPage = nextPage.getElementsByTagName('a')[0].href;

  const productsList = body.getElementsByClassName('shop2-product-item product-list__item');
  const initVars = getInitVars(dom);

  for(let item of Object.values(productsList)) {
    const kind_id = getKindId(item);
    const name = getName(item);
    let price = getPrice(item);
    const row = sheet.addRow([name, price]);

    if(config.getCount) {
      const delay = new Promise((resolve) => {
        setTimeout(() => resolve(), config.query_interval + Math.random()*config.add_random_interval);
      });

      await delay;

      const options = {
        method: 'POST',
        uri: 'http://strike-ball.ru/my/s3/api/shop2/?cmd=cartAddItem',
        form: {
          hash: initVars.apiHash.cartAddItem,
          ver_id: initVars.verId,
          kind_id,
          amount: 1000000
        }
      };
      const count_response = await rp(options);
      let obj = JSON.parse(count_response);
      count = obj.errstr ? +obj.errstr[0].match(/\d/g).join('') : 0;
      row.getCell(3).value = count;
      console.log(`\t- ${name}`);
    }


  }

  await excel.save();
  if(config.getCount) console.log(`Запись в файл [${excel.path}]`);

  const subTime = Math.floor((Date.now() - startTime)/1000);
  let timeString = `${subTime} сек.`;

  if(subTime >= 60) timeString = `${Math.floor(subTime/60)} мин. ${subTime%60} сек.`;
  console.log(`Прошло ${timeString}`);

  if(nextPage) await getProductsList(excel, host, category, nextPage);


  return true;


}

function getInitVars(dom){
  const head = dom.window.document.head.getElementsByTagName('script');

  let id;
  Object.values(head).forEach((item, i) => {
    if(item.innerHTML.includes('init')) id = i;
  })

  const jsonString = head[id].innerHTML.slice(11, head[id].innerHTML.indexOf(');shop2.filter'));
  const obj = JSON.parse(jsonString);

  return obj;
}

function getName(item){
  let name = item.getElementsByClassName('product-name')[0];

  if(!name) return false;

  name = innerText(name.innerHTML);

  return name;
}

function getPrice(item){
  let price = item.getElementsByClassName('price-current')[0];

  if(!price) return 0;

  price = innerText(price.innerHTML);
  if(+price.replace(/\D/, '') > 0) price = +price.replace(/\D/, '');

  return price;
}

function getKindId(obj){
  const inputs = obj.getElementsByTagName('input');
  if(inputs[0].name == 'kind_id') return inputs[0].value;

  return false;
}

module.exports.getProductsList = getProductsList;
