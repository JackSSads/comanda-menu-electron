import electronPrinter from "@thesusheer/electron-printer";
import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";
import { config } from "dotenv";

config();

class CustomPrinter {
    constructor(printer_name) {
        this.printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `printer:${printer_name}`,
            characterSet: "SLOVENIA",
            driver: electronPrinter,
            removeSpecialCharacters: false,
            lineCharacter: "-",
        });
    };

    async newOrder(order) {
        this.printer.alignCenter();
        this.printer.println(`${String(order.name_estabeleciment).toUpperCase()}`);
        this.printer.drawLine();

        this.printer.alignLeft();
        this.printer.println(`Cliente: ${order.client}`);
        this.printer.drawLine();

        this.printer.println(`Itens:`);
        order.items.forEach((item) => {
            this.printer.println(
                `• ${item.quantity}x ${item.name_product} - R$ ${parseFloat(item.price).toFixed(2)}`
            );
            item?.obs && this.printer.println(`OBS: ${item.obs}`)
        });

        this.printer.drawLine();
        order?.obs && this.printer.println(`Observação: ${order.obs}`);

        this.printer.cut();

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            return { title: "Erro na impressão", body: error.message }
        };
    };

    async closeCheck(order) {
        this.printer.alignCenter();
        this.printer.println(`${String(order.name_estabeleciment).toUpperCase()}`);
        this.printer.drawLine();

        this.printer.alignLeft();
        this.printer.println(`Cliente: ${order.name_client}`);
        this.printer.drawLine();

        this.printer.println(`Itens:`);
        order.items.forEach((item) => {
            this.printer.println(
                `• ${item.quantity}x ${item.product_name} - R$ ${parseFloat(item.total_price).toFixed(2)}`
            );
            item.obs && this.printer.println(`OBS: ${item.obs}`);
        });

        this.printer.drawLine();
        this.printer.println(`Total: R$ ${parseFloat(order.total_value).toFixed(2)}`);

        this.printer.cut();

        try {
            await this.printer.execute();
            return { title: "Impressão concluída", body: "Pedido impresso com sucesso!" };
        } catch (error) {
            return { title: "Erro na impressão", body: error.message }
        };
    };
};

export default CustomPrinter;