import electronPrinter from "@thesusheer/electron-printer";
import { ThermalPrinter, PrinterTypes, CharacterSet } from "node-thermal-printer";

class CustomPrinter {
    constructor(printer_name) {
        this.printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `printer:${printer_name}`,
            characterSet: CharacterSet.SLOVENIA,
            driver: electronPrinter,
            removeSpecialCharacters: false,
            lineCharacter: "-",
        });
    };

    async newOrder(order) {
        this.printer.alignLeft();
        this.printer.println(`Cliente: ${order.client}`);
        this.printer.drawLine();

        this.printer.println(`Itens:`);
        order.items.forEach((item) => {
            this.printer.println(
                `• ${item.quantity}x ${item.name_product}`
            );
            item?.obs && this.printer.println(`OBS: ${item.obs}`)
        });

        this.printer.drawLine();
        order?.obs && this.printer.println(`Observação: ${order.obs}`);

        this.printer.cut();
        this.printer.beep(2);

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            return { title: "Erro na impressão", body: error.message }
        };
    };

    async closeCheck(order) {
        this.generateReceipt(order);
        const width = this.printer.getWidth();
        const line = "-".repeat(width);

        const center = (text = "") => {
            const space = Math.floor((width - text.length) / 2);
            return " ".repeat(space > 0 ? space : 0) + text;
        };

        const formatCols = (code, desc, price, qtd, total) => {
            return (
                code.padStart(6, "0") + " " +
                desc.padEnd(18, " ").slice(0, 18) + " " +
                price.toFixed(2).padStart(6, " ") + " " +
                String(qtd).padStart(3, "0") + " " +
                total.toFixed(2).padStart(7, " ")
            );
        };

        const getTimeSpent = (createdAt) => {
            const start = new Date(createdAt);
            const now = new Date();

            const diffMs = now - start;

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            return `${hours}h e ${minutes}min`;
        };

        this.printer.alignCenter();
        this.printer.setTextDoubleHeight();
        this.printer.bold(true);
        this.printer.println(order.estabishment_name.toUpperCase());
        this.printer.bold(false);
        this.setTextNormal();

        this.printer.println("Maracajaú - RN");
        this.printer.println("");

        // INFO
        this.printer.alignLeft();
        const now = new Date();

        this.printer.println(`CLIENTE: ${order.name_client}`);
        this.printer.println(`DATA DE IMPRESSÃO: ${now.toLocaleString("pt-BR")}`);

        this.printer.println(`PEDIDO: ${String(order.check_id).padStart(6, "0")}`);

        this.printer.println(center("RELATÓRIO DE CONSUMO"));
        this.printer.println(line);

        // TABLE
        this.printer.println("CODIGO DESCRIÇÃO      PREÇO QTD TOTAL");
        this.printer.println(line);

        // ITEMS
        order.items.forEach((item) => {
            this.printer.println(
                formatCols(
                    item.product_id,
                    item.product_name,
                    parseFloat(item.unit_price),
                    item.quantity,
                    parseFloat(item.total_price)
                )
            );

            if (item.obs) {
                this.printer.println(`      OBS: ${item.obs}`);
            };
        });

        this.printer.println(line);

        // TOTAL
        this.printer.alignCenter();
        this.printer.bold(true);
        this.printer.setTextDoubleHeight();
        this.printer.println(`TOTAL  R$ ${parseFloat(order.total_value).toFixed(2)}`);
        this.printer.setTextNormal();
        this.printer.bold(false);

        this.printer.println("");

        // FOOTER
        this.printer.alignLeft();
        this.printer.println(`PERMANÊNCIA: ${getTimeSpent(order.createdAt)}`);

        this.printer.println("");
        this.printer.alignCenter();
        this.printer.println("NAO E DOCUMENTO FISCAL");
        this.printer.println(line);

        this.printer.cut();

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            console.log(error)
            return { title: "Erro na impressão", body: error.message }
        };
    };

    async printQuantityChange(data) {
        this.printer.alignLeft();
        this.printer.println(`Cliente: ${data.client}`);
        this.printer.drawLine();

        this.printer.println(`Alterações de Quantidade:`);
        this.printer.println(
            `• ${data.product_name}: ${data.old_quantity} -> ${data.new_quantity}`
        );

        this.printer.drawLine();
        data.obs && this.printer.println(`Observação: ${data.obs}`);

        this.printer.cut();

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            return { title: "Erro na impressão", body: error.message }
        };
    };

    async printProductRemoved(data) {
        this.printer.alignLeft();
        this.printer.println(`Cliente: ${data.client}`);
        this.printer.drawLine();

        this.printer.println(`Pedido cancelado:`);
        this.printer.println(
            `• ${String(data.product_name)}`, { strikethrough: true }
        );

        this.printer.drawLine();
        data.obs && this.printer.println(
            `Observação: ${data.obs}`, { strikethrough: true }
        );

        this.printer.cut();

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            return { title: "Erro na impressão", body: error.message }
        };
    };

    async generateReceipt(order) {
        const width = 48;

        const line = "-".repeat(width);

        const center = (text = "") => {
            const space = Math.floor((width - text.length) / 2);
            return " ".repeat(space > 0 ? space : 0) + text;
        };

        const getTimeSpent = (createdAt) => {
            const start = new Date(createdAt);
            const now = new Date();

            const diffMs = now - start;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            return `${hours}h e ${minutes}min`;
        };

        const formatRow = (code, desc, price, qtd, total) => {
            return (
                code.padStart(6, "0") + " " +
                desc.padEnd(18, " ").slice(0, 18) + " " +
                price.toFixed(2).padStart(6, " ") + " " +
                String(qtd).padStart(3, "0") + " " +
                total.toFixed(2).padStart(7, " ")
            );
        };

        let output = "";

        // HEADER
        output += center(order.estabishment_name.toUpperCase()) + "\n";
        output += center("Maxaranguape - RN") + "\n\n";

        const now = new Date();

        // INFO
        output += `DATA DE IMPRESSÃO: ${now.toLocaleString("pt-BR")}\n`;
        output += `PEDIDO: ${String(order.check_id).padStart(6, "0")}\n`;
        output += center("RELATÓRIO DE CONSUMO") + "\n";

        output += line + "\n";

        // TABLE HEADER
        output += "CODIGO DESCRIÇÃO      PREÇO QTD TOTAL\n";
        output += line + "\n";

        // ITEMS
        order.items.forEach((item) => {
            output += formatRow(
                String(item.product_id),
                item.product_name,
                parseFloat(item.price),
                item.quantity,
                parseFloat(item.total_price)
            ) + "\n";

            if (item.obs) {
                output += `      OBS: ${item.obs}\n`;
            }
        });

        output += line + "\n";

        // TOTAL
        output += center(`TOTAL  R$ ${parseFloat(order.total_value).toFixed(2)}`) + "\n\n";

        // FOOTER
        output += `OPERADOR(A): ${order.operator || "SUPERVISOR"}\n`;
        output += `LOCAL: Mesa ${order.table || "-"}\n`;
        output += `PERMANÊNCIA: ${getTimeSpent(order.createdAt)}\n\n`;

        output += center("NAO E DOCUMENTO FISCAL") + "\n";
        output += line + "\n";

        console.log(output);
    };
};

export default CustomPrinter;
