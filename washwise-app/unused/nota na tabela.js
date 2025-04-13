async function printReceipt(receipt) {
  console.log("here");
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: String.raw`\\.\COM3`,
      options: {
        timeout: 1000,
      },
      width: 48,
      characterSet: CharacterSet.SLOVENIA,
      breakLine: BreakLine.WORD,
      removeSpecialCharacters: false,
      lineCharacter: '-',
    });

    const isConnected = await printer.isPrinterConnected();
    console.log('Printer connected:', isConnected);

    printer.alignCenter();
    await printer.printImage("logo_.png");
    printer.newLine();
    printer.newLine();

    printer.alignLeft();
    printer.bold(true);
    printer.leftRight("Lavandaria 3 Marias", `Nº: ${receipt.receipt_id}`);
    printer.bold(false);
    printer.println("Av. 25 de Abril, 241");
    printer.leftRight("4830-512 Póvoa de Lanhoso", new Date().toLocaleDateString('pt-PT'));
    printer.println("Tlf: 253 634 051");

    printer.newLine();
    printer.newLine();

    printer.alignLeft();
    printer.bold(true);
    printer.print("Cliente: ");
    printer.bold(false);
    printer.println(receipt.client_name);
    printer.newLine();

    const col1Width = 15; // Width for quantity column
    const col2Width = 33; // Width for product description column

    printer.println('┌' + ''.padEnd(col1Width - 2, '─') + '┬' + ''.padEnd(col2Width - 2, '─') + '┐');

    printer.print('│ ');
    printer.bold(true);
    printer.print('Quantidade'.padEnd(col1Width - 3, ' '));
    printer.bold(false);
    printer.print('│ ');
    printer.bold(true);
    printer.print('Peça'.padEnd(col2Width - 3, ' '));
    printer.bold(false);
    printer.print('│');
    printer.println('');

    printer.println('├' + ''.padEnd(col1Width - 2, '─') + '┼' + ''.padEnd(col2Width - 2, '─') + '┤');

    receipt.products.forEach((peca, index) => {
      let description = peca.description;
      if (description.length > col2Width - 4) {
        description = description.substring(0, col2Width - 7) + '...';
      }

      printer.print('│ ' + peca.quantity.toString().padEnd(col1Width - 3, ' ') + '│ ');
      printer.print(description.padEnd(col2Width - 3, ' ') + '│');
      printer.println('');

      let note = peca.note ? peca.note.trim() : '';
      if (note) {
        const wrappedNote = [];
        const maxLineLength = col2Width - 5; // accommodates '- ' prefix and spacing
        let current = '- ' + note;

        while (current.length > maxLineLength) {
          wrappedNote.push(current.slice(0, maxLineLength));
          current = current.slice(maxLineLength);
        }
        if (current.length > 0) wrappedNote.push(current);

        wrappedNote.forEach((line) => {
          const leftPadding = ''.padEnd(col1Width - 3, ' ');
          printer.println('│ ' + leftPadding + '│ ' + line.padEnd(col2Width - 3, ' ') + '│');
        });
      }

      if (index < receipt.products.length - 1) {
        printer.println('├' + ''.padEnd(col1Width - 2, '─') + '┼' + ''.padEnd(col2Width - 2, '─') + '┤');
      }
    });

    printer.println('└' + ''.padEnd(col1Width - 2, '─') + '┴' + ''.padEnd(col2Width - 2, '─') + '┘');

    printer.newLine();

    printer.alignLeft();
    printer.bold(true);
    printer.print("Levantamento: ");
    printer.bold(false);
    printer.println(receipt.date);
    printer.newLine();

    printer.cut();

    console.log(printer.getText());

    try {
      await printer.execute();
      console.log('Print success.');
    } catch (error) {
      console.error('Print error:', error);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao guardar e imprimir o talão:", error);
    return { success: false, error: error.message };
  }
}