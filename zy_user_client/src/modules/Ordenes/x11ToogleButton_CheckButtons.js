import React, { useState } from 'react';

import CheckButton_Ingredientes from './x12CheckButton_Ingredientes';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

const ToogleButton_CheckButtons = ({ index, platillo, tipo_ingrediente, ingredientes_checkbutton, despliegue, toggleChecked_Status, setToggleChecked_Status, statusCheckBoxes, handleUpdateStatusCheckBoxes }) => {
  const [toggleChecked, setToggleChecked] = useState(false);

  const handleToggleChange = () => {
    setToggleChecked(!toggleChecked);
  };

  const inputId = `toggle${platillo}All_${index}`;


  return (
    <div>
      <div className="row mb-3">
        <div className="col">
          {/* align BootstrapSwitchButton to the right of the col */}
          <div className="float-right">
            <BootstrapSwitchButton
                    checked={handleToggleChange}
                    // Todos los ${tipo_ingrediente}
                    onlabel={`Todos los ${tipo_ingrediente}`}
                    offlabel={`Todos los ${tipo_ingrediente}`}
                    onstyle="success"
                    width={200}
                    onChange={handleToggleChange}
                    size='xs'
                />
          </div>
        </div>
      </div>

      <CheckButton_Ingredientes
        index={inputId}
        opciones_in={ingredientes_checkbutton}
        toggleChecked={toggleChecked}
        despliegue={despliegue}
        toggleChecked_Status={toggleChecked_Status}
        setToggleChecked_Status={setToggleChecked_Status}
        statusCheckBoxes={statusCheckBoxes}
        handleUpdateStatusCheckBoxes={handleUpdateStatusCheckBoxes}
        />
    </div>
  );
};

export default ToogleButton_CheckButtons;
