function soloNumeros(e){
    key = e.keyCode || e.which;
    teclado = String.fromCharCode(key); //convertir el codigo de la tecla a una cadena
    numeros = "0123456789";
    especiales = "8-37-38-46"; //array de teclas especiales aceptadas retroceso: 8, izq: 37, der: 38, supr: 46
    teclado_especial = false;
    for(var i in especiales){ //recorre el array de teclas especiales
        if(key == especiales[i]){ //si la tecla especial esta en el array
            teclado_especial = true; //es una tecla especial
        }
    }
    if(numeros.indexOf(teclado)==-1 && !teclado_especial){ //si el caracter no esta en el array de numeros y no es una tecla especial
        return false;
    }
}