<?php
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zonna Yummy</title>
    <link rel="stylesheet" href="css/form_ventas.css">
    <!--CDN de Bootstrap-->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
</head>
<body>  
    <?php include "components/x01_navbar.php"; ?>
    <div class="container-fluid">
        <!--Titulo y Fecha-->
        <div class="row rowheader">
            <div class="col-1 "></div>
            <div class="col-3 rowheader">
                <div class="titleContainer">
                    <h2 class="titleForm">Formulario de pedido</h2>
                </div>
            </div>
            <div class="col-7 rowheader">
                <?php include "components/x02_time.php"; ?>
            </div>
            <div class="col-1"></div>
        </div>
        <!--Formulario-->
        <div class="row rowform">
            <div class="col-4"></div>
            <div class="col-4 form">
                <form action="db_mysql/ZYPx01Ventas_AgregarVenta.php" method="POST">
                    <!--Tamaño de Pizzas-->
                    <label for="pedido_tamano">Tamaño de pizza</label>
                    <select class="form-control" id="pedido_tamano" name="pedido_tamano">
                        <!--Option Individual with img-->
                        <option value="Individual">Individual</option>
                        <option value="Chica">Chica</option>
                        <option value="Mediana">Mediana</option>
                        <option value="Grande">Grande</option>
                        <option value="Familiar">Familiar</option>  
                        <option value="Mega">Mega</option>
                    </select>
                    <!--Cantidad de Sabores-->
                    <label for="pedido_numsabores">Cantidad de sabores</label>
                    <select class="form-control" id="pedido_numsabores" name="pedido_numsabores">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                    <!--Selección de sabores-->
                    <div class="group_sabores" style="padding-top: 10px;">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-6">
                                    <!--Button for collapsable function-->
                                    <!--       tipo              clases                           id                 funcion                            area a collapsar           no se                   no se-->
                                    <button type="button" class="btn btn-primary btn_sabor_1" id="boton_sabor1" data-toggle="collapse" data-target="#collapse_options_sabor1"> <!--aria-expanded="false" aria-controls="sabor1">-->
                                        Sabor numero 1 de la pizza
                                    </button>
                                    <!--Radio group for sabor #1 in pizza (collapsable)-->
                                    <div class="collapse" id="collapse_options_sabor1">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_1" value="Hawaiana">
                                            <label class="form-check-label" for="sabor1_1">Hawaiana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_2" value="Pepperoni">
                                            <label class="form-check-label" for="sabor1_2">Pepperoni</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_3" value="4 Quesos">
                                            <label class="form-check-label" for="sabor1_3">4 Quesos</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_4" value="Mexicana">
                                            <label class="form-check-label" for="sabor1_4">Méxicana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_5" value="Carnes Frías">
                                            <label class="form-check-label" for="sabor1_5">Carnes Frías</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor1" id="sabor1_6" value="Champinones">
                                            <label class="form-check-label" for="sabor1_6">Champiñones</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <!--Button for collapsable function-->
                                    <button type="button" class="btn btn-primary btn_sabor_2" id="boton_sabor2" data-toggle="collapse" data-target="#collapse_options_sabor2" style="display: none;">
                                        Sabor numero 2 de la pizza
                                    </button>
                                    <!--Radio group for sabor #2 in pizza (collapsable)-->
                                    <div class="collapse" id="collapse_options_sabor2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_1" value="Hawaiana">
                                            <label class="form-check-label" for="sabor2_1">Hawaiana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_2" value="Pepperoni">
                                            <label class="form-check-label" for="sabor2_2">Pepperoni</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_3" value="4 Quesos">
                                            <label class="form-check-label" for="sabor2_3">4 Quesos</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_4" value="Mexicana">
                                            <label class="form-check-label" for="sabor2_4">Méxicana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_5" value="Carnes Frías">
                                            <label class="form-check-label" for="sabor2_5">Carnes Frías</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor2" id="sabor2_6" value="Champinones">
                                            <label class="form-check-label" for="sabor2_6">Champiñones</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <!--Button for collapsable function-->
                                    <button type="button" class="btn btn-primary btn_sabor_3" id="boton_sabor3" data-toggle="collapse" data-target="#collapse_options_sabor3" style="display: none;">
                                        Sabor numero 3 de la pizza
                                    </button>
                                    <!--Radio group for sabor #3 in pizza (collapsable)-->
                                    <div class="collapse" id="collapse_options_sabor3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_1" value="Hawaiana">
                                            <label class="form-check-label" for="sabor3_1">Hawaiana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_2" value="Pepperoni">
                                            <label class="form-check-label" for="sabor3_2">Pepperoni</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_3" value="4 Quesos">
                                            <label class="form-check-label" for="sabor3_3">4 Quesos</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_4" value="Mexicana">
                                            <label class="form-check-label" for="sabor3_4">Méxicana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_5" value="Carnes Frías">
                                            <label class="form-check-label" for="sabor3_5">Carnes Frías</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor3" id="sabor3_6" value="Champinones">
                                            <label class="form-check-label" for="sabor3_6">Champiñones</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <!--Button for collapsable function-->
                                    <button type="button" class="btn btn-primary btn_sabor_4" id="boton_sabor4" data-toggle="collapse" data-target="#collapse_options_sabor4" style="display: none;">
                                        Sabor numero 4 de la pizza
                                    </button>
                                    <!--Radio group for sabor #4 in pizza (collapsable)-->
                                    <div class="collapse" id="collapse_options_sabor4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_1" value="Hawaiana">
                                            <label class="form-check-label" for="sabor4_1">Hawaiana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_2" value="Pepperoni">
                                            <label class="form-check-label" for="sabor4_2">Pepperoni</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_3" value="4 Quesos">
                                            <label class="form-check-label" for="sabor4_3">4 Quesos</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_4" value="Mexicana">
                                            <label class="form-check-label" for="sabor4_4">Méxicana</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_5" value="Carnes Frías">
                                            <label class="form-check-label" for="sabor4_5">Carnes Frías</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sabor4" id="sabor4_6" value="Champinones">
                                            <label class="form-check-label" for="sabor4_6">Champiñones</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--Nombre del Cliente-->
                    <label for="pedido_nombre">Nombre del cliente</label>
                    <input type="text" class="form-control" id="pedido_nombre" name="pedido_nombre" placeholder="Nombre del cliente">
                    <!--Numero del Cliente-->
                    <label for="pedido_telefono">Numero del cliente</label>
                    <input type="text" class="form-control" id="pedido_telefono" name="pedido_telefono" placeholder="Numero del cliente">
                    <!--Input Date for Fecha de la orden-->
                    <label for="pedido_fecha">Fecha de la orden</label>
                    <input type="date" class="form-control" id="pedido_fecha" name="pedido_fecha" placeholder="Fecha de la orden">
                    <!--Input Time for Hora de la orden-->
                    <label for="pedido_hora">Hora de la orden</label>
                    <input type="time" class="form-control" id="pedido_hora" name="pedido_hora" placeholder="Hora de la orden">
                    <div class="container_button_timepickerpc" style="text-align: right;">
                        <button type="button" class="btn btn-primary" id="button_timepickerpc">
                            Introducir digitalmente
                        </button>
                    </div>
                    <div id="timepicker-containter" style="display: none;">
                        <div id="timepicker"> 
                        </div>
                    </div>
                    <script>
                        let analogclock = document.getElementById('timepicker-containter');
                        let button_timepickerpc = document.getElementById('button_timepickerpc');
                        button_timepickerpc.addEventListener('click', function(){
                            /* Hide or show the element analogclock */
                            if(analogclock.style.display == 'none'){
                                analogclock.style.display = 'block'
                                /* Make scrolldown of the Height of the element analogclock */
                                window.scrollBy(0,analogclock.offsetHeight+20);
                            }
                            else{
                                analogclock.style.display = 'none';
                            }
                        });
                    </script>
                    <!--Button for submit-->
                    <button type="submit" class="btn btn-primary">Enviar</button>
                </form>
            </div>
            <div class="col-4"></div>
        </div>
        <!--Espacio en blanco-->
        <div class="whiteSpace">.</div>
    </div>
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
    <script src="js/script.js"></script>
    <script>
        document.getElementById("pedido_telefono").onkeypress = soloNumeros;
    </script>
    <script src="js/form_ventas.js"></script>
    <script src="timepicker.js"></script>
    <script type="text/javascript">
        'use strict';
        const picker=new Timepicker();
        picker.setLightTheme(true);
        const container=document.getElementById('timepicker');
        const pickerElm=picker.getElement();
        pickerElm.style.marginLeft='calc(50% - 120px)';
        pickerElm.style.marginTop='12px';
        pickerElm.style.marginBottom='12px';
        container.appendChild(pickerElm);
        picker.onPicked=function(){
            const timeStr=document.getElementById('pedido_hora');
            let timeText=picker.getTimeString();
            timeStr.value=timeConverter12AMto24(timeText);
            timeStr.focus()
            analogclock.style.display = 'none';
        };
        /* Function change 12 hrs format to 24 hrs format */
        function timeConverter12AMto24(time){
            if(time.indexOf('AM')!==-1){
                time=time.replace(' AM','');
            }
            if(time.indexOf('PM')!==-1){
                time=time.replace(' PM','');
                const timeArr=time.split(':');
                const hour=parseInt(timeArr[0]);
                if(hour!==12){
                    time=`${hour+12}:${timeArr[1]}`;
                }
            }
            /* Change timeText from HH:MM to HH:MM:SS add the at the end 00 */
            time=`${time}:00`;
            return time;
        }
        picker.show();
    </script>
</body>
</html>