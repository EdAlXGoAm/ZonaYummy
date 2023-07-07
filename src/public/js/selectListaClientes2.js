var clientesSelector = document.getElementById('ClientesList');
clientesSelector.addEventListener('change', function(){
    valor = clientesSelector.value;
    console.log(valor);
    if(valor == '0'){
        inputApodoCliente = document.getElementById('pedido_apodoid');
        inputApodoCliente.value = "";
        inputNameCliente = document.getElementById('pedido_nombre');
        inputNameCliente.value = "";
        inputNumCliente = document.getElementById('pedido_telefono');
        inputNumCliente.value = "";
        idClienteInput = document.getElementById('id_cliente');
        idClienteInput.value = "-";
    }
    else{
        $.ajax({
            url: 'db_mysql/ZPYx01Clientes_FillCliente.php',
            type: 'POST',
            data: {
                'numCliente': valor
            }
            }).done(function(respuesta){
                console.log('Campo cliente llenado correctamente');
                console.log('Respuesta: ' + respuesta);
                apodoClienteQuery = respuesta.split('-')[0].split('/')[0];
                nombreClienteQuery = respuesta.split('-')[0].split('/')[1];
                numClienteQuery = respuesta.split('-')[1];
                inputApodoCliente = document.getElementById('pedido_apodoid');
                inputApodoCliente.value = apodoClienteQuery;
                inputNameCliente = document.getElementById('pedido_nombre');
                inputNameCliente.value = nombreClienteQuery;
                inputNumCliente = document.getElementById('pedido_telefono');
                inputNumCliente.value = numClienteQuery;
                idClienteInput = document.getElementById('id_cliente');
                idClienteInput.value = valor;
                //console.log(respuesta);
            }).fail(function(){
                console.log('Error');
            });
        }
});