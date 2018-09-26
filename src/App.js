import React, { Component } from 'react';
import logo from './logo.svg';
import socketIOClient from 'socket.io-client'

import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { socket: socketIOClient("http://localhost:9000") };
    this.textInput = React.createRef();
    this.getAllCards();
  }

  componentDidMount() {
    this.state.socket.on('Cards changed', (response) => {
        console.log(response);
        this.setState({ ...response });
    });
  }

  getAllCards() {
    fetch('http://localhost:9000/allDatas')
      .then(response => {
        return response.json();
      }).then(response => {
        this.setState({ ...response });
      });
  }

  sendNotif(socket) {
    socket.emit('Cards changed');
  }

  createColumn() {
    let value = this.textInput.current.value;
    if (value) {
      let form = new URLSearchParams();
      form.append('type', value);
      fetch('http://localhost:9000/columns', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
      }).then(response => {
        this.sendNotif(this.state.socket);
      });
    }
  }

  render() {
    let columns = this.state.columns || [];
    let cards = this.state.cards || [];
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React Todo List </h1>
        </header>
        <div className="App-intro">
          <input ref={this.textInput} />
          <button onClick={() => { this.createColumn() }}>Create</button>
          {columns.map((column, i) => {
            let cardsFilter = cards.filter((card) => card.type === column.type).sort((a, b) => b.date > a.date);
            return <CardList type={column.type} key={i} cards={cardsFilter} sendNotif={() => this.sendNotif(this.state.socket)} />;
          })}
        </div>
      </div>
    );
  }
}

class CardList extends Component {

  constructor(props) {
    super(props);
    this.state = { newCards: [] };
  }

  deleteColumn(id) {
    fetch('http://localhost:9000/columns/' + id, {
      method: 'DELETE'
    }).then(value => {
      this.setState({ hide: true });
      this.props.sendNotif();
    });
  }

  render() {
    return (
      <div>
        <button>Create</button>
        <ul>
          {this.props.cards.map((elt, i) => {
            return <Line line={elt} key={i} type={this.props.type} sendNotif={this.props.sendNotif} />;
          })}
        </ul>
      </div>
    )
  }
}

class Line extends Component {

  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.state = { editing: this.props.editing };
  }

  createOrUpdateTask(line) {
    let value = this.textInput.current.value;
    if (value) {
      console.log(line);
      if (line._id) {
        line.name = value;
        this.updateLine(line);
      } else {
        this.createTask(value)
      }
    } else if (line._id) {
      this.deleteLine(line._id);
    }
  }


  createTask(value) {
    if (value) {
      let form = new URLSearchParams();
      form.append('name', value);
      form.append('type', this.props.type);
      fetch('http://localhost:9000/cards', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
      }).then(value => {
        this.setState({ editing: !this.state.editing });
        this.props.sendNotif();
      });
    }
  }

  deleteLine(id) {
    fetch('http://localhost:9000/cards/' + id, {
      method: 'DELETE'
    }).then(value => {
      this.setState({ editing: !this.state.editing });
      this.props.sendNotif();
    });
  }

  updateLine(line) {
    fetch('http://localhost:9000/cards/' + line._id, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: line
    }).then(value => {
      this.setState({ editing: !this.state.editing });
      this.props.sendNotif();
    });
  }

  render() {
    if (this.state.editing) {
      return (
        <li>
          <textarea ref={this.textInput} >
            {this.props.line.name}
          </textarea>
          <button onClick={() => { this.deleteLine(this.props.line._id) }}>
            Delete
          </button>
          <button onClick={() => { this.createOrUpdateTask(this.props.line) }}>
            Add
          </button>
        </li>)
    }

    return (
      <li>
        {this.props.line.name}
        <button onClick={() => { this.setState({ editing: !this.state.editing }) }}>
          Editer
        </button>
      </li>)
  }
}

export default App;