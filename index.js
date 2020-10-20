const {getProductsList} = require('./modules/request.js');
const Excel = require('./modules/excel.js');
const config = require('./config.json');
const fs = require('fs');

const excel = new Excel();

class Category {
  static list = [];

  constructor(name, link){
    this.name = name;
    this.path = link;

    Category.list.push(this);

    return this;
  }
}

async function main(){

  for(let category of config.categorys){
    new Category(category.name, category.path);
  }

  global.startTime = Date.now();

  for(let item of Category.list){
    try{
      await getProductsList(excel, 'http://strike-ball.ru', item);
    }catch(e){
      fs.writeFileSync(`./error_${Date.now()}.json`, e);
      console.log(`ERROR: [${e.name}]`);
      process.exit();
    }
  }

  console.log(`Завершено!\nДанные сохранены в файл [${excel.path}]`);

}

main();

process.on('SIGINT', async function() {
  if(await excel.save()) console.log(`Обработка остановлена!\nЗагруженные данные были сохранены в файл [${excel.path}]`);
  process.exit();
})
