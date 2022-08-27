import React from 'react';
import {Button} from "react-bootstrap";

const App = () => {
    return (
        <div>
            <h1>this is App page init by create-react-app</h1>
            <hr/>
            <Button
                disabled={true}
                active={false}
                variant={"primary"}
                size={"sm"}
            >click this button</Button>
        </div>
    );
};

export default App;
