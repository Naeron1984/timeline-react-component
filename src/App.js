import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class TestCanvasManyElements extends Component {
  render() {
    return (
        <canvas ref="canvas" width={300} height={300} style={{border: "1px solid gray"}}/>
    );
  }

  componentDidMount() {
      this.updateCanvas();
  }
  updateCanvas() {
      const ctx = this.refs.canvas.getContext('2d');
      ctx.fillStyle=this.props.Color;
      ctx.fillRect(0,0, 100, 100);
  }  
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <TestCanvasManyElements Color="#FF0000"/>
        <TestCanvasManyElements Color="#00FF00"/>
      </div>
    );
  }
}

export default App;
