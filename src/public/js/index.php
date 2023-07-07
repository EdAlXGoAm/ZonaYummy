<?php
session_start();
?>


<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zona Yummy</title>
    <link rel="stylesheet" href="css/styles8082.css">
    <!--CDN de Bootstrap-->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    <!--Fuentes-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tourney:wght@700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Jura:wght@500&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Signika:wght@300&display=swap" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
    <script src="https://kit.fontawesome.com/75f2d840d4.js" crossorigin="anonymous"></script>
</head>

<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand" href="#"><img src="https://yt3.ggpht.com/Mm8WiNx7THKqlQfPODF9poK4mMuE16hnZHCMW6SX-9UI7lxV6mcbQvCEzKx8aLMxVpbxszSovw=s88-c-k-c0x00ffffff-no-rj" alt="" width="30" height="30" class="d-inline-block align-text-top"> Zona Yummy</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item"><a class="nav-link active" aria-current="page" href="#">Home</a></li>
                    <li class="nav-item"><a class="nav-link disabled" href="#">Miscelanea</a></li>
                    <li class="nav-item"><a class="nav-link" href="#">Pizzería</a></li>
                    <li class="nav-item"><a class="nav-link disabled" href="#">Repostería</a></li>
                </ul>
                <form class="d-flex">
                    <input class="form-control me-2" type="search" placeholder="Buscar producto" aria-label="Search">
                    <button class="btn btn-outline-success" type="submit">Buscar</button>
                    <img class="d-inline-block align-text-top" src="https://image.flaticon.com/icons/png/512/107/107831.png" alt="" width="30" height="30">
                </form>
            </div>
        </div>
    </nav>
    <div class=".container presentacion">
        <div class="row row0">
            <div class="col-2 c_logoPE">
                <div class="Logo">
                    <img src="svg/LogoPE.svg" class="logoPE" alt="logo">
                </div>
            </div>
            <div class="col-8 c_tituloPE">
                <img src="svg/TituloPE.svg" class="tituloPE" alt="titulo">
            </div>
        </div>
        <div class="row row1">
            <div class="col-2">
                <div class="buttons">
                    <img src="svg/logoUser.svg" class="img_logouser" alt="LogUser">
                    <?php
                        if(isset($_SESSION['name'])){
                            echo("<div id='btn_usuario' class='c_btn_registro_usuario'>".$_SESSION['name']."</div>");
                            echo("<div id='btn_logout' class='c_btn_login'><a href='src/php/logout.php' class='c_btn_logout'>Cerrar Sesión</a></div>");
                        } else{
                            echo("<div id='btn_registro' class='c_btn_registro_usuario'>Registrarme</div>");
                            echo("<div id='btn_login' class='c_btn_login'>Iniciar Sesión</div>");
                        }
                    ?>
                    <a href="#"><img src="svg/btn_inicio.svg" href="#" class="btn_buttons" alt="Inicio"></a>
                    <a href="#Menu"><img src="svg/btn_menu.svg" class="btn_buttons" alt="Menú"></a>
                    <a href="#Pedir"><img src="svg/btn_pedir.svg" href="#" class="btn_buttons" alt="Pedir"></a>
                </div>

                <!--- PopUp Registro --->
                <div id="registro_overlay_dis" class="c_registro_overlay">
                    <div id="registro_popup" class="c_registro_popup">
                        <a href="#" id="registro_popup_close" class="c_registro_popup_close"><i class="fas fa-times"></i></a>
                        <h3>Registrate</h3>
                        <h4>Y haz tu pedido</h4>
                        <form action="src/php/register.php" class="c_inputs" method="post">
                            <div class="form_registro">
                                <input class="c_registro_input" type="text" name="f_r_name" placeholder="Nombre">
                                <input class="c_registro_input" type="tel" name="f_r_phone" placeholder="55 1234 5678" pattern="[5]{1}[5-6]{1}[0-9]{8}">
                                <input class="c_registro_input" type="text" name="f_r_pass" placeholder="password">
                            </div>
                            <input type="submit" class="btn_start_registro" value="Registrarme">
                        </form>
                    </div>
                </div>
                
                <!--- PopUp Iniciar Sesión --->
                <div id="login_overlay_dis" class="c_login_overlay">
                    <div id="login_popup" class="c_login_popup">
                        <a href="#" id="login_popup_close" class="c_login_popup_close"><i class="fas fa-times"></i></a>
                        <h3>Inicia sesión</h3>
                        <h4>Y haz tu pedido</h4>
                        <form action="src/php/login.php" class="c_inputs" method="post">
                            <div class="form_sesion">
                                <input class="c_login_input" type="tel" name="f_l_phone" placeholder="55 1234 5678" pattern="[5]{1}[5-6]{1}[0-9]{8}">
                                <input class="c_login_input" type="password" name="f_l_pass" placeholder="••••••••">
                            </div>
                            <input type="submit" class="btn_start_login" value="Iniciar Sesión">
                        </form>
                    </div>
                </div>
                <script src="src/popups.js"></script>

            </div>
            <!-----container-center----->
            <div class="col-8">
                <div class="c_center">
                    <div class=".container">
                        <!-----Menu de Ingredientes----->
                        <div class="row c_menu">
                            <div class="col-6">
                                <!--Especialidades-->
                                <div class="row t_titulo_row">
                                    <h2>Precios</h2>
                                </div>
                                <div class="row-12 ci_especial">
                                    <img src="img/Preciosv0.5.png" class="especial" alt="Escand">
                                </div>
                                <!------------------>
                            </div>
                            <div class="col-6">
                                <!--Ingredientes-->
                                <div class="row t_titulo_row">
                                    <a name="Menu"><h2>Menú de Ingredientes</h2></a>
                                </div>
                                <hr>
                                <div class="row">
                                    <div class="col-2"></div>
                                    <div class="col-4">
                                        <a><b>INGREDIENTE <FONT COLOR="green">Disponible</b></FONT><img src="svg/bool_icon_true.svg" class="checklist"></a>
                                    </div>
                                    <div class="col-4">
                                        <a><b>INGREDIENTE <FONT COLOR="red">Agotado</b></FONT><img src="svg/bool_icon_false.svg" class="checklist"></a>
                                    </div>
                                    <div class="col-2"></div>
                                </div>
                                <hr>
                                <script>
                                    num_ingredientes = 0;
                                    ingrediente = ["Piña", "si", "Jamón", "si", "Elote", "si", "Champiñones", "si", "Pepperoni", "si", "Salchicha", "si",
                                    "Chorizo", "si", "Jitomate", "si", "Tocino", "si", "Frijoles", "si", "Pimiento", "si", "Cebolla", "si",
                                    "Atún", "si", "Q. Americano", "si", "Q. Philadelphia", "si", "Fresa", "si", "Duraznos", "si", "Agüacate", "si",
                                    "Aceitunas", "si","Jalapeños", "si"];
                                    images_ingredientes =["ruta1"];
                                    for(j=0; j<=4; j++){
                                        document.write("<div class='row c_row_ingredientes'>");
                                        for(i=0; i<4; i++){
                                            document.write("<div class='col-3 c_ingrediente' alt='ingrediente"+i+"'><a><FONT size='-1'><b>"+ingrediente[(i*2)+(j*8)]+"</b></FONT></a>");
                                            if(ingrediente[(2*i)+(j*8)+1] == "si"){
                                                document.write("<img src='svg/bool_icon_true.svg' alt='checklist_"+ingrediente[(i*2)+(j*8)]+"'>");}else{
                                                document.write("<img src='svg/bool_icon_false.svg' class='checklist"+ingrediente[i+(j*8)]+"'>");}
                                            document.write("<img src='img/sabores/Sab"+(num_ingredientes+1)+".png' class='ci_ingrediente' alt='img_"+ingrediente[(i*2)+(j*8)]+"'></div>");
                                            num_ingredientes++;
                                            if(num_ingredientes == 20){break;}}
                                        document.write("</div>");
                                    }
                                </script>
                                <!------------------>
                            </div>
                        </div>
                        <!---------------------------------------------------------------->
                        <!-----Inicio----->
                        <div class="row c_inicio">
                            <div class="row c_tradi_escanda">
                                <div class="col c_te_aling_c">
                                    <img src="svg/Sabores_11.svg" class="imgsabores_1" alt="Sabores">
                                </div>
                                <div class="col c_te_aling_c">
                                    <img src="svg/Escand.svg" class="escandimg" alt="Escand">
                                </div>
                            </div>
                            <div class="row c_infoPedir">
                                <p class="t_infoPedir">Comunicate a nuestro WhatsApp y pide cualquier sabor tradicional<br>o arma tu pizza con los ingredientes del menú<br>
                                <img src="svg/wa_logo.svg" class="ci_wa_logo"><br><FONT size="12px"><a  class="num">55 7460 0823</a></FONT>
                                </p>
                            </div>
                        </div>
                        <!---------------------------------------------------------------->
                        <!-----Pedir----->
                        <div class="row c_inicio">
                            <div class="row t_titulo_row">
                                <a name="Pedir"><h2>Realiza tu pedido</h2></a>
                            </div>
                            <div class="row c_infoPedir">
                                <p class="t_infoPedir">Esta función aún no esta en funcionamiento. Para realizar tu pedido:</p>
                            </div>
                            <div class="row c_infoPedir">
                                <p class="t_infoPedir">Comunicate a nuestro WhatsApp y pide cualquier sabor tradicional o arma tu pizza<br>
                                <img src="svg/wa_logo.svg" class="ci_wa_logo"><br><FONT size="12px"><a  class="num">55 7460 0823</a></FONT>
                                </p>
                            </div>
                        </div>
                        <!---------------------------------------------------------------->

                    </div>
                </div>
            </div>
            <!----- Cuadro Horario ROJO ----->
            <div class="col-2">
                <div class="c_horario">
                    <FONT COLOR="#FFFFFF"><h2>Hora Actual</h2></FONT>
                    <div style="position: relative;" class="clockrelative">
                        <img src="img/H_reloj.png" class="clockbase" alt="img_clock">
                        <img src="img/Manecilla_hour.png" class="clockbase mane_hour" alt="img_clock">
                        <img src="img/Manecilla_min.png" class="clockbase mane_min" alt="img_clock">
                        <img src="img/Manecilla_min.png" class="clockbase mane_seg" alt="img_clock">
                    </div>
                    <script>
                        let ancho_divhorario = Math.round($( ".c_horario" ).width());
                        let ancho_reloj = Math.round($( ".clockbase" ).width());
                        marginclockleft = Math.round((ancho_divhorario-ancho_reloj)/2);
                        $('.clockbase').css('left',marginclockleft+'px');
                    </script>
                    <script>
                        function muestraReloj() {
                            var fechaHora = new Date();
                            var dia = fechaHora.getDay();
                            var horas = fechaHora.getHours();
                            var minutos = fechaHora.getMinutes();
                            var segundos = fechaHora.getSeconds();

                            if(horas < 10) { horas = '0' + horas; }
                            if(minutos < 10) { minutos = '0' + minutos; }
                            if(segundos < 10) { segundos = '0' + segundos; }

                            hoursdegrees = 360/12*horas;
                            mindegrees = 360/60*minutos;
                            segdeg = 360/60*segundos;

                            //if(horas > 12){horas -= 12;}

                            $('.mane_hour').css({transform: 'rotate('+hoursdegrees+'deg)' });
                            $('.mane_min').css({transform: 'rotate('+mindegrees+'deg)' });
                            $('.mane_seg').css({transform: 'rotate('+segdeg+'deg)' });
                            ampm = 'am';
                            if(horas > 12){horas -= 12; ampm = 'pm';}
                            else if(horas == 12){horas = 12; ampm = 'pm';}
                            document.getElementById("reloj").innerHTML = horas+':'+minutos+':'+segundos+' '+ampm;
                        }

                        window.onload = function() {
                            setInterval(muestraReloj, 1000);
                        }

                        open_close = 0;
                        var fechaHora_once = new Date();
                        var dia_once = fechaHora_once.getDay();
                        var horas_once = fechaHora_once.getHours();
                        var minutos_once = fechaHora_once.getMinutes();
                        if(((dia_once >= 4 && dia_once <= 6) || dia_once == 0) && (horas_once >= 15 && horas_once < 22)){
                            open_close = 1;
                        }
                        else{
                            open_close = 0;
                        }
                        document.write("<div id='reloj' class='t_time parrafosobrereloj'></div>");
                        if(open_close){
                            document.write("<img src='svg/H_OpenClose_1.svg' class='ci_imagesHorario' alt='img_OpenClose'>");}else{
                            document.write("<img src='svg/H_OpenClose_0.svg' class='ci_imagesHorario' alt='img_OpenClose'>");}
                        document.write("<FONT COLOR='#FFFFFF'><h2>Horario</h2></FONT>")
                        document.write("<p class='t_time'>3:00 pm - 10:00 pm</p>")
                    </script>
                    <img src="svg/H_dias.svg" class="ci_dias" alt="img_dias">
                </div>
            </div>
            <!---------------------------------------------------------------->
        </div>
    </div>
    <div class="bienvenida">
        <h1> Bienvenido a Zona Yummy</h1>
        <p>
            Puedes hacer tus pedidos de Pizzería aquí, <i style="color:darkgray">próximamente Miscelanea y Repostería.</i>
        </p>
    </div>
</body>

</html>