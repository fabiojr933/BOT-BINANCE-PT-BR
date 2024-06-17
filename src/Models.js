require("dotenv").config();
const knex = require("../database/config");

class Models {
  async Inserir(tabela, dados) {
    try {
      await knex(tabela).insert(dados);
      return "dados inserido com sucesso";
    } catch (error) {
      return error;
    }
  }

  async Alterar(tabela, identificador, dados) {
    try {
      await knex(tabela).update(dados).where(identificador);
      return "dados alterado com sucesso";
    } catch (error) {
      return error;
    }
  }

  async Selecionar(tabela, identificador) {
    try {
      const dados = await knex(tabela).select('*').where(identificador);
      return dados;
    } catch (error) {
      return error;
    }
  }
  async UltimaVenda(tabela, identificador) {
    try {
      const dados = await knex(tabela).where(identificador).orderBy('id', 'desc').first();
      return dados ? dados : 0.00;
    } catch (error) {
      return error;
    }
  }
  async UltimaCompra(tabela, identificador) {
    try {
      const dados = await knex(tabela).where(identificador).orderBy('id', 'desc').first();
      return dados ? dados : 0.00;
    } catch (error) {
      return error;
    }
  }
}
module.exports = Models;
