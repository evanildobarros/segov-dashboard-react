import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrency, formatCurrency } from '../src/utils/formatters.js';

test('valores da API preservam casas decimais sem multiplicar o investimento', () => {
  assert.equal(parseCurrency(9818600.25), 9818600.25);
  assert.equal(parseCurrency('9818600.25'), 9818600.25);
  assert.equal(parseCurrency('R$ 9.818.600,25'), 9818600.25);
  assert.equal(parseCurrency('1.000'), 1000);
});
test('zero é diferente de valor não informado', () => {
  assert.equal(parseCurrency(0), 0);
  for (const value of [null, undefined, '', '   ', 'N/D']) assert.equal(parseCurrency(value), null);
  assert.equal(formatCurrency(null), 'Não informado');
  assert.match(formatCurrency(0), /R\$\s*0/);
});
test('moeda utiliza separador decimal brasileiro', () => {
  assert.match(formatCurrency(1484150000), /1,48/);
  assert.match(formatCurrency(1234.5), /1,23/);
});
