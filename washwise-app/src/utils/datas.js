//Funcoes de data partilhadas pelo Novo Talao (CheckboxSelector) e pela aba
//Taloes (ReceiptPreview). Nada aqui muda o que se grava: o campo `date` do
//talao continua a ser gravado tal como sempre foi ("5ª", "Sab (Sem falta)",
//"15 Set"). Isto e so o que se le no ecra e o que sai no papel.
//
//O electron/main.js tem uma copia do textoLevantamento, por correr noutro
//processo. Se mexeres aqui, mexe la tambem.

//Meses abreviados para o texto que sai no talão e no preview ("15 Set").
export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

//Dia da semana no rótulo que a loja usa. Indexado por getDay(): 0 e domingo.
//Sabado e domingo nao sao ordinais, o resto e ("2ª" = segunda).
export const DIAS = ["Dom", "2ª", "3ª", "4ª", "5ª", "6ª", "Sab"];

//AAAA-MM-DD -> "15 Set"
export const textoDaData = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return Number(d) + " " + MESES[m - 1];
};

//AAAA-MM-DD -> "5ª". A data e construida em hora local a partir dos numeros,
//nunca com new Date(texto): assim o dia da semana nao escorrega por causa do
//fuso quando a data vem da API como "2026-08-27T00:00:00.000Z".
export const diaDaSemanaDaData = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return DIAS[new Date(y, m - 1, d).getDay()];
};

//hoje em AAAA-MM-DD, em hora local (nunca toISOString, que passa por UTC)
export const hojeISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
};

//soma dias a uma data ISO; setDate() e imune as mudancas de hora
export const somaDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return dt.getFullYear() + "-" + mm + "-" + dd;
};

//O que se le no talao impresso e no preview: "5ª (15 Mai) - Sem falta".
//
//O dia da semana vem SEMPRE da data real, para o dia e a data nunca se
//poderem contradizer — e assim tanto faz o talao ter sido criado pelo dia da
//semana ("5ª") como pelo calendario ("15 Set"), sai no mesmo formato.
//Do texto gravado so se aproveita o modificador ("Sem falta", "Fim do dia").
//
//Sem data real — a maioria dos taloes antigos, que a migracao 004 nao
//preencheu — fica o texto tal como foi gravado. Nao ha data para inventar.
export const textoLevantamento = (date, deliveryDate) => {
  const texto = date || "";
  if (!deliveryDate) return texto;

  //serve tanto "2026-05-15" (calculado cá) como "2026-05-15T00:00:00.000Z" (API)
  const iso = String(deliveryDate).slice(0, 10);
  const dia = diaDaSemanaDaData(iso);
  const data = textoDaData(iso);
  if (!dia || !data) return texto;

  //"5ª (Sem falta)" -> "Sem falta"; "3ª" e "15 Set" nao tem modificador
  const partes = texto.split("(");
  const modificador = partes.length > 1 ? partes[1].replace(")", "").trim() : "";

  return dia + " (" + data + ")" + (modificador ? " - " + modificador : "");
};
