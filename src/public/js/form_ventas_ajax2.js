$(document).ready(function(){
    $('#form_addVenta').submit(function(e){
        e.preventDefault();
        var data = $(this).serialize();
        $.ajax({
            url: 'db_mysql/ZYPx01Ventas_AgregarVenta.php',
            type: 'POST',
            data: data
        }).done(function(respuesta){
            console.log('Se agrego la venta correctamente');
            console.log(respuesta);
            $('#form_addVenta')[0].reset();
            $('#boton_sabor1').html('Sabor 1');
            $('#boton_sabor2').html('Sabor 2');
            $('#boton_sabor3').html('Sabor 3');
            $('#boton_sabor4').html('Sabor 4');
            button_sabor2.style.display = 'none';
            button_sabor3.style.display = 'none';
            button_sabor4.style.display = 'none';
            button_sabor1.style.display = 'block';
            sabor1_selected = false;
            sabor2_selected = false;
            sabor3_selected = false;
            sabor4_selected = false;
            var date = new Date();
            var date = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
            $.ajax({
                url: 'db_mysql/ZPYx01Ventas_GetVentas.php',
                type: 'POST',
                data: {
                    'input_number': 5,
                    'all': 0,
                    'start_date': '2022-01-01',
                    'start_time': '00:00:00',
                    'end_date': date,
                    'end_time': '23:59:59'
                }
                }).done(function(respuesta){
                    console.log('Se actualizó correctamente la lista de Ventas');
                    $('#showedResult').html(respuesta)
                }).fail(function(){
                    console.log('Error');
                });
            $.ajax({
                url: 'db_mysql/ZPYx01Clientes_GetClientes.php',
                type: 'POST',
                data: {
                    'action': 'getClientesTabla'
                }
                }).done(function(respuesta){
                    console.log('Se actualizó correctamente la lista de Clientes');
                    $('#showedClientes').html(respuesta)
                }).fail(function(){
                    console.log('Error');
                });
            $('#form_get_pedidos_table')[0].reset();
        }).fail(function(){
            console.log('Error');
        });
    });
});