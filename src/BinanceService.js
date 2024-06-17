const Binance = require('binance-api-node').default;
const config = require('../config/config');

class BinanceService {
  constructor() {
    this.cliente = Binance({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      httpBase: config.httpBase,
    });
  }

  async obterSaldo(moeda) {
    const informacoesDaConta = await this.cliente.accountInfo();
    const saldo = informacoesDaConta.balances.find(balance => balance.asset === moeda);
    return saldo ? parseFloat(saldo.free) : 0;
  }

  async obterPreco(moeda) {
    const preco = await this.cliente.prices({ symbol: `${moeda}BRL` });
    console.log(preco);  
    return parseFloat(preco[`${moeda}BRL`]);
  }

  async obterQuantidadeMinima(moeda) {
    const info = await this.cliente.exchangeInfo();
    const simboloInfo = info.symbols.find(s => s.symbol === `${moeda}BRL`);
    const filtro = simboloInfo.filters.find(f => f.filterType === 'LOT_SIZE');
    return parseFloat(filtro.minQty);
  }

  async comprarMoeda(moeda, quantidade) {
    const quantidadeMinima = await this.obterQuantidadeMinima(moeda);
    if (quantidade < quantidadeMinima) {
      throw new Error(`Quantidade inferior a ${quantidadeMinima}, comprar no mínimo ${quantidadeMinima}`);
    }

    const saldoBRL = await this.obterSaldo('BRL');
    const preco = await this.obterPreco(moeda);
    const valorNecessario = quantidade * preco;

    if (valorNecessario > saldoBRL) {
      throw new Error('Saldo insuficiente para a ação solicitada');
    }

    return await this.cliente.order({
      symbol: `${moeda}BRL`,
      side: 'BUY',
      type: 'MARKET',
      quantity: quantidade,
    });
  }

  async venderMoeda(moeda, quantidade) {
    const quantidadeMinima = await this.obterQuantidadeMinima(moeda);
    if (quantidade < quantidadeMinima) {
      throw new Error(`Quantidade inferior a ${quantidadeMinima}, vender no mínimo ${quantidadeMinima}`);
    }

    const saldoMoeda = await this.obterSaldo(moeda);
    if (quantidade > saldoMoeda) {
      throw new Error('Saldo insuficiente para a ação solicitada');
    }

    return await this.cliente.order({
      symbol: `${moeda}BRL`,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantidade,
    });
  }
}

module.exports = BinanceService;
