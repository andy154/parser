const ExcelJS = require('exceljs');
const config = require('../config.json');

class Excel {

  constructor(){
    this.book = new ExcelJS.Workbook();
    this.worksheet = null;

    this.path = `${config.outputFilePath}${Date.now()}.xlsx`;

    return this;
  }

  async save(){
    try{
      const fileName = this.path;
      await this.book.xlsx.writeFile(fileName);
      return true;
    }catch(e){
      return false;
    }
  }

}

module.exports = Excel;
