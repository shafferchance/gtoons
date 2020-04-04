import { Button, TextField } from '@material-ui/core';
import { debounce, isEqual } from 'lodash';
import * as React from 'react';
import { queryParams, request } from '../../utils/api';
import { isValidEmail } from '../../utils/validation';
import { RegisterProps, RegisterState } from './types';

export default class Register extends React.Component<
  RegisterProps,
  RegisterState
> {
  constructor(props: RegisterProps) {
    super(props);
    this.state = {
      usernameAvailable: null,
      emailAvailable: null,
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      passwordErrors: [],
      complete: false,
      failed: false,
    };

    // wait a second after the user has stopped typing to fire the API calls
    this.getUsernameIsValid = debounce(this.getUsernameIsValid, 1000);
    this.getEmailIsValid = debounce(this.getEmailIsValid, 1000);
  }

  componentDidUpdate(_prevProps: RegisterProps, prevState: RegisterState) {
    const { username, email } = this.state;
    if (!isEqual(prevState.username, username)) {
      this.getUsernameIsValid();
    }
    if (!isEqual(prevState.email, email)) {
      this.getEmailIsValid();
    }
  }

  getUsernameIsValid = () => {
    const { username } = this.state;
    request({
      method: 'get',
      url: `register/validUsername${queryParams({
        username,
      })}`,
    }).then((usernameAvailable) => this.setState({ usernameAvailable }));
  };

  getEmailIsValid = () => {
    const { email } = this.state;
    if (!isValidEmail(email)) {
      return;
    }
    request({
      method: 'get',
      url: `register/validEmail${queryParams({
        email,
      })}`,
    }).then((emailAvailable) => this.setState({ emailAvailable }));
  };

  onInputChange = (e: React.ChangeEvent) => {
    const {
      target: { name, value },
    } = e as any;

    this.setState((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  renderUsernameAvailable = () => {
    const { usernameAvailable, username } = this.state;
    if (usernameAvailable === null || !username) {
      return null;
    }
    return usernameAvailable
      ? 'This username is available!'
      : 'This username is not available.';
  };

  renderEmailAvailable = () => {
    const { emailAvailable, email } = this.state;
    if (emailAvailable === null || !email || emailAvailable) {
      return null;
    }
    return 'An account exists for this email. ';
  };

  validatePassword = (password: string) => {
    // 7 character min
    // 1 uppercase
    // 1 lowercase

    const passwordErrors = [];

    if (password.length < 7) {
      passwordErrors.push('Must be at least 7 characters');
    }
    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
      passwordErrors.push('Must contain at least 1 uppercase letter');
    }
    const hasLowercase = /[a-z]/.test(password);
    if (!hasLowercase) {
      passwordErrors.push('Must contain at least 1 lowercase charater');
    }

    this.setState({
      passwordErrors,
    });
  };

  renderPasswordErrors = () => {
    const { passwordErrors } = this.state;

    return (
      <ul>
        {passwordErrors.map((error) => {
          return <li key={error}>{error}</li>;
        })}
      </ul>
    );
  };

  renderConfirmPasswordErrors = () => {
    const { password, confirmPassword } = this.state;

    if (password === confirmPassword) {
      return null;
    }
    return (
      <ul>
        <li>Passwords don't match</li>
      </ul>
    );
  };

  submit = () => {
    if (this.hasErrors()) {
      return;
    }

    const { username, email, password, confirmPassword } = this.state;

    request({
      method: 'post',
      url: 'register/submit',
      data: {
        username,
        email,
        password,
        confirmPassword,
      },
    })
      .then((response) => {
        if (response.id) {
          this.setState({ complete: true });
        }
      })
      .catch((error) => this.setState({ failed: true }));
  };

  renderSuccess = () => {
    return (
      <section>
        <h2>Registration complete!</h2>
        <Button
          color="primary"
          onClick={() => {
            const { history } = this.props;
            history.push('/login');
          }}
        >
          Go to Login
        </Button>
      </section>
    );
  };

  renderForm = () => {
    const {
      username,
      email,
      password,
      confirmPassword,
      passwordErrors,
      failed,
    } = this.state;

    return (
      <form onSubmit={this.submit}>
        {failed && (
          <h3>
            Sorry we were unable to proccess your registration, please try
            again.
          </h3>
        )}
        <div>
          <TextField
            label="Username"
            name="username"
            id="username"
            value={username}
            helperText={this.renderUsernameAvailable()}
            onChange={this.onInputChange}
          />
        </div>
        <div>
          <TextField
            type="email"
            label="Email"
            name="email"
            id="email"
            value={email}
            helperText={this.renderEmailAvailable()}
            onChange={this.onInputChange}
          />
        </div>
        <div>
          <TextField
            label="Password"
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={(e) => {
              this.validatePassword(e.target.value);
              this.onInputChange(e);
            }}
          />
          {passwordErrors.length > 0 && this.renderPasswordErrors()}
        </div>
        <div>
          <TextField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPassword}
            onChange={this.onInputChange}
          />
          {this.renderConfirmPasswordErrors()}
        </div>
        <Button
          style={{ marginTop: 10 }}
          disabled={this.hasErrors()}
          variant="contained"
          color="primary"
          onClick={this.submit}
        >
          Submit
        </Button>
      </form>
    );
  };

  hasErrors = () => {
    const {
      username,
      email,
      passwordErrors,
      password,
      confirmPassword,
      usernameAvailable,
      emailAvailable,
    } = this.state;

    return (
      passwordErrors.length > 0 ||
      confirmPassword !== password ||
      !usernameAvailable ||
      !emailAvailable ||
      username.length === 0 ||
      email.length === 0 ||
      password.length === 0 ||
      confirmPassword.length === 0
    );
  };

  render() {
    const { complete } = this.state;
    return (
      <div>
        <h1>Register to play GToons</h1>
        {!complete ? this.renderForm() : this.renderSuccess()}
      </div>
    );
  }
}
