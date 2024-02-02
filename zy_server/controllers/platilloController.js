const Platillo = require("../models/platilloModel");

exports.getPlatillos = (req, res) => {
  Platillo.find()
    .then((platillos) => res.json(platillos))
    .catch((err) => res.status(400).json("Error: " + err));
};

exports.getPlatillo = (req, res) => {
  Platillo.findOne({ PlatilloId: req.params.id })
    .then((platillo) => res.json(platillo))
    .catch((err) => res.status(400).json("Error: " + err));
};

exports.addPlatillo = (req, res) => {
  console.log(`Platillo: `,req.body)
  const newPlatillo = new Platillo({
      PlatilloId: req.body.PlatilloId,
      Categoria: req.body.Categoria,
      NombrePlatillo: req.body.NombrePlatillo,
      Descripcion: req.body.Descripcion,
      Imagen: req.body.Imagen,
      Disponibilidad: req.body.Disponibilidad,
      SelectedVariant: req.body.SelectedVariant,
      Variants: req.body.Variants
  });
  newPlatillo
    .save()
    .then(() => res.json("Platillo añadido!"))
    .catch((err) => res.status(400).json("Error: " + err));
};

exports.updatePlatillo = (req, res) => {
  Platillo.findOne({ PlatilloId: req.body.PlatilloId })
    .then((platillo) => {
      platillo.PlatilloId = req.body.PlatilloId;
      platillo.Categoria = req.body.Categoria;
      platillo.NombrePlatillo = req.body.NombrePlatillo;
      platillo.Descripcion = req.body.Descripcion;
      platillo.Imagen = req.body.Imagen;
      platillo.Disponibilidad = req.body.Disponibilidad;
      platillo.SelectedVariant = req.body.SelectedVariant;
      platillo.Variants = req.body.Variants;

      platillo
        .save()
        .then(() => res.json("Platillo actualizado!"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("Error: " + err));
};

exports.deletePlatillo = (req, res) => {
  Platillo.findOneAndDelete({ PlatilloId: req.params.id })
    .then(() => res.json("Platillo eliminado!"))
    .catch((err) => res.status(400).json("Error: " + err));
};

exports.getLastPlatilloId = (req, res) => {
  Platillo.find()
    .then((platillos) => {
      if (platillos.length === 0) {
        console.log("No hay platillos disponibles para mostrar.");
        return res.json(0);
      }
      else {
        console.log("Last platillo Id: ", platillos[platillos.length - 1].PlatilloId)
        return res.json(platillos[platillos.length - 1].PlatilloId)
      }
    })
}