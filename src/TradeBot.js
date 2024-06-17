const BinanceService = require('./BinanceService');
const config = require('../config/config');
const Database = require("./Models");
const database = new Database();
const moment = require("moment");

class TradeBot {
  constructor() {
    this.binanceService = new BinanceService();
    this.precoDeCompra = 0.00; // Defina o valor de compra do BNB
    this.quantidadeDeCompra = 0.00; // Quantidade de BNB para comprar
    this.quantidadeDeVenda = 0.00; // Quantidade de BNB para vender
  }

  async verificarMercado(moeda) {

    try {
      const preco = await this.binanceService.obterPreco(moeda);
      const saldo = await this.binanceService.obterSaldo(moeda);


      let dadosMoeda = await database.Selecionar('moedas', { moeda: `${moeda}BRL` });
      let variacao = parseFloat(dadosMoeda[0].variacao);
      this.quantidadeDeVenda = parseFloat(dadosMoeda[0].quantidadedevenda);
      this.quantidadeDeCompra = parseFloat(dadosMoeda[0].quantidadedecompra);
      this.precoDeCompra = parseFloat(parseFloat(dadosMoeda[0].precodecompra).toFixed(2));


      // Pegando o valor e salvando no banco de dados
      const identificador = { moeda: `${moeda}BRL` };
      const precoAtual = { precoatual: preco };
      const saldoAtual = { saldo: saldo };
      await database.Alterar("moedas", identificador, precoAtual);
      await database.Alterar("moedas", identificador, saldoAtual);

      // Faz o calculo com base na ultima venda
      const ultimoVenda = await database.UltimaVenda('vendas', identificador);
      var valor_ultima_compra = parseFloat(ultimoVenda.valor_pago);
      let resultado = parseFloat(this.quantidadeDeVenda) + (valor_ultima_compra / preco);
      this.quantidadeDeVenda = await this.truncarParaQuatroCasasDecimais(resultado);
      console.log(this.quantidadeDeVenda);

      const ultimoCompra = await database.UltimaCompra('compras', identificador);
      var valor_compra_compra = parseFloat(ultimoCompra.valor_pago);
      let resultado_compra = parseFloat(this.quantidadeDeVenda) + (valor_compra_compra / preco);
      this.quantidadedecompra = await this.truncarParaQuatroCasasDecimais(resultado_compra);
      console.log(this.quantidadeDeCompra);


      console.log(`Preço do ${moeda}: ${preco}, Saldo de ${moeda}: ${saldo}`);

      if (preco < this.precoDeCompra - variacao) {
        console.log(`Comprando ${moeda}...`);
        console.log(this.precoDeCompra);
        const resultado = await this.binanceService.comprarMoeda(moeda, this.quantidadeDeCompra);
        const data = [
          {
            moeda: resultado.symbol,
            preco: parseFloat(resultado.fills[0].price),
            qtde: parseFloat(resultado.fills[0].qty),
            data: moment().format(),
            valor_pago: parseFloat(resultado.cummulativeQuoteQty)
          },
        ];
        await database.Inserir("compras", data);

        const precoPago = { precodecompra: parseFloat(resultado.fills[0].price) };
        await database.Alterar("moedas", identificador, precoPago);

        console.log('Compra realizada:', resultado);
      } else if (preco > this.precoDeCompra + variacao && saldo >= this.quantidadeDeVenda) {
        console.log(`Vendendo ${moeda}...`);       
        const resultado = await this.binanceService.venderMoeda(moeda, this.quantidadeDeVenda);
        const data = [
          {
            moeda: resultado.symbol,
            preco: parseFloat(resultado.fills[0].price),
            qtde: parseFloat(resultado.fills[0].qty),
            data: moment().format(),
            valor_pago: parseFloat(resultado.cummulativeQuoteQty)
          },
        ];
        await database.Inserir("vendas", data);

        const precoPago = { precodecompra: parseFloat(resultado.fills[0].price) };
        await database.Alterar("moedas", identificador, precoPago);
        
        console.log('Venda realizada:', resultado);
      } else {
        console.log('Aguardando melhor preço para vender ou comprar!');
      }
    } catch (erro) {
      console.error('Erro ao executar operação:', erro);
    }
  }

  async truncarParaQuatroCasasDecimais(numero) {
    return Math.floor(numero * 1000) / 1000;
  }

  iniciar(moeda) {
    setInterval(() => this.verificarMercado(moeda), 10000); // Checa o mercado a cada 30 segundos
  }

}

module.exports = TradeBot;
