const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const platilloSchema = new mongoose.Schema({
    PlatilloId : { type : Number, required: true, unique: true },
    Categoria : { type : String },
    NombrePlatillo : { type : String, required: true },
    Descripcion : { type : String },
    Imagen : { type : String },
    Disponibilidad : { type : Number, required: true },
    SelectedVariant: { type : Number},
    Variants : [{
        VariantName: { type : String },
        Precio: { type : Number },
        Componentes : [{
            Name: { type : String },
            Precio: { type : Number },
            Checked: { type : Boolean }
        }],
        Opciones : [{
            Name: { type : String },
            SelectedItem: { type : Number },
            Items : [{
                Name: { type : String },
                Precio: { type: Number }
            }]
        }],
        Ingredientes : [{
            Type : { type : String },
            Name : { type : String },
            SelectedItem: { type : Number },
            Items : [{
                Checked: { type : Boolean },
                Name: { type : String },
                SelectedCantidad : { type : Number },
                ItemCantidad : [{
                    Name: { type : String }
                }]
            }],
        }],
        Extras : [{
            Checked : { type: Boolean },
            Extra : { type : String },
            Precio : { type : Number },
            SelectedOpcion: { type : Number },
            Opciones : [{ type : String }],
            SelectedCantidad : { type : Number },
            Cantidad : [{ type : String }]
        }],
        Adicionales : [{
            Checked : { type: Boolean },
            Adicional : { type : String },
            Precio : { type : Number },
            SelectedOpcion: { type : Number },
            Opciones : [{ type : String }],
            SelectedCantidad : { type : Number },
            Cantidad : [{ type : String }]
        }]
    }]
})

module.exports = mongoose.model('Platillo', platilloSchema, 'platillos_new');
