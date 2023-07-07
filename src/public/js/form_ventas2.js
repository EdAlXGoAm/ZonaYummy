var button_sabor1 = document.getElementById('boton_sabor1');
var button_sabor2 = document.getElementById('boton_sabor2');
var button_sabor3 = document.getElementById('boton_sabor3');
var button_sabor4 = document.getElementById('boton_sabor4');
var sabor1 = document.getElementById('collapse_options_sabor1');
var sabor2 = document.getElementById('collapse_options_sabor2');
var sabor3 = document.getElementById('collapse_options_sabor3');
var sabor4 = document.getElementById('collapse_options_sabor4');
var sabor1_selected = false;
var sabor2_selected = false;
var sabor3_selected = false;
var sabor4_selected = false;
//Collapsable function for sabor button 1
//Collapse sabor2 sabor3 and sabor4
button_sabor1.addEventListener('click', function(){
    sabor2.classList.remove('show');
    sabor3.classList.remove('show');
    sabor4.classList.remove('show');
});
//Collapsable function for sabor button 2
//Collapse sabor1 sabor3 and sabor4
button_sabor2.addEventListener('click', function(){
    sabor1.classList.remove('show');
    sabor3.classList.remove('show');
    sabor4.classList.remove('show');
});
//Collapsable function for sabor button 3
//Collapse sabor1 sabor2 and sabor4
button_sabor3.addEventListener('click', function(){
    sabor1.classList.remove('show');
    sabor2.classList.remove('show');
    sabor4.classList.remove('show');
});
//Collapsable function for sabor button 4
//Collapse sabor1 sabor2 and sabor3
button_sabor4.addEventListener('click', function(){
    sabor1.classList.remove('show');
    sabor2.classList.remove('show');
    sabor3.classList.remove('show');
});
//Hide button_sabor2, button_sabor3 and button_sabor4 and Show button_sabor1 when sabores is 1
//Hide button_sabor3 and button_sabor4 and Show button_sabor1 and button_sabor2 when sabores is 2
//Hide button_sabor4 and Show button_sabor1, button_sabor2 and button_sabor3 when sabores is 3
//Show button_sabor1, button_sabor2, button_sabor3 and button_sabor4 when sabores is 4
var sabores = document.getElementById('pedido_numsabores');
sabores.addEventListener('change', function(){
    sabor1.classList.remove('show');
    sabor2.classList.remove('show');
    sabor3.classList.remove('show');
    sabor4.classList.remove('show');
    if(sabores.value == 1){
        button_sabor2.style.display = 'none';
        button_sabor3.style.display = 'none';
        button_sabor4.style.display = 'none';
        button_sabor1.style.display = 'block';
    }
    else if(sabores.value == 2){
        button_sabor1.style.display = 'block';
        button_sabor3.style.display = 'none';
        button_sabor4.style.display = 'none';
        button_sabor2.style.display = 'block';
    }
    else if(sabores.value == 3){
        button_sabor1.style.display = 'block';
        button_sabor2.style.display = 'block';
        button_sabor4.style.display = 'none';
        button_sabor3.style.display = 'block';
    }
    else if(sabores.value == 4){
        button_sabor1.style.display = 'block';
        button_sabor2.style.display = 'block';
        button_sabor3.style.display = 'block';
        button_sabor4.style.display = 'block';
    }
});
/* Evaluate if any sabor1 radio button was selected and write the value in boton_sabor1 */
sabor1.addEventListener('change', function(){
    sabor1_selected = true;
    var sabor_selected1 = document.querySelector('input[name="sabor1"]:checked');
    /* Change text of boron_sabor1 for sabor_selected1.value */
    button_sabor1.innerHTML = sabor_selected1.value;
    sabor1.classList.remove('show');
    if(sabores.value >= 2 && sabor2_selected == false){
        sabor2.classList.add('show');
    }
});
/* Evaluate if any sabor2 radio button was selected and write the value in boton_sabor2 */
sabor2.addEventListener('change', function(){
    sabor2_selected = true;
    var sabor_selected2 = document.querySelector('input[name="sabor2"]:checked');
    /* Change text of boron_sabor2 for sabor_selected2.value */
    button_sabor2.innerHTML = sabor_selected2.value;
    sabor2.classList.remove('show');
    if(sabores.value >= 3 && sabor3_selected == false){
        sabor3.classList.add('show');
    }
});
/* Evaluate if any sabor3 radio button was selected and write the value in boton_sabor3 */
sabor3.addEventListener('change', function(){
    sabor3_selected = true;
    var sabor_selected3 = document.querySelector('input[name="sabor3"]:checked');
    /* Change text of boron_sabor3 for sabor_selected3.value */
    button_sabor3.innerHTML = sabor_selected3.value;
    sabor3.classList.remove('show')
    if(sabores.value == 4 && sabor4_selected == false){
        sabor4.classList.add('show');
    }
});
/* Evaluate if any sabor4 radio button was selected and write the value in boton_sabor4 */
sabor4.addEventListener('change', function(){
    sabor4_selected = true;
    var sabor_selected4 = document.querySelector('input[name="sabor4"]:checked');
    /* Change text of boron_sabor4 for sabor_selected4.value */
    button_sabor4.innerHTML = sabor_selected4.value;
    sabor4.classList.remove('show');
});

var x = window.matchMedia("(max-width: 1280px)");
matchedFunction(x);
x.addListener(matchedFunction);
function matchedFunction(x) {
    inputNumeroPedido = document.getElementById('inputNumeroPedido');
    if(x.matches){
        inputNumeroPedido.innerHTML = '<input type="number" class="form-control" id="pedido_telefono" name="pedido_telefono" placeholder="Numero del cliente">';
        document.getElementById('container_button_timepickerpc').style.display = 'none';
    } else {
        /* Add the html '<input type="text" class="form-control" id="pedido_telefono" name="pedido_telefono" placeholder="Numero del cliente">' */
        inputNumeroPedido.innerHTML = '<input type="text" class="form-control" id="pedido_telefono" name="pedido_telefono" placeholder="Numero del cliente">';
        document.getElementById("pedido_telefono").onkeypress = soloNumeros;
        document.getElementById('container_button_timepickerpc').style.display = 'block';
    }
    
}