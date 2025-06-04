import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useUser } from '../context/UserContext';
import {common} from "../styles";
import { loginUser, createUser, logoutUser, update_password} from '../services/APIService';
import Config from 'react-native-config';
import EncryptedStorage from 'react-native-encrypted-storage';

const UsernameScreen = () => {
  const { username, saveUsername } = useUser();
  const [inputUser, setInputUser] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [actionType, setActionType] = useState('create')

  // Pre-fill the input when the screen loads
  useEffect(() => {

    setInputUser(username);

  }, [username]);


  const login = async () => {
    if (inputUser.trim() == '' || inputPassword.trim() == '') {
        alert('Username or password cannot be empty');
        return
    }
        const data = await loginUser(inputUser.trim(), inputPassword.trim()); // Expecting { access_token, refresh_token }
        if (data) {
            alert('You are logged in')
            saveUsername(inputUser.trim())
        }
        else {
        console.log('Username or password is not correct')
            alert('Username or password is not correct')
        }

};
  const logout = async () => {
    logoutUser()
    saveUsername('')
    setInputPassword('')
  };

  const create_user = async () => {
    if (inputUser.trim() == '' || inputPassword.trim() == '' || inputCode.trim() == '') {
        alert('Username or password or code cannot be empty');
        return
    }
        const data = await createUser(inputUser.trim(), inputPassword.trim(),inputCode.trim() ); // Expecting { access_token, refresh_token }
        if (data) {
            alert('Your User is created and you are logged in')
            saveUsername(inputUser.trim())
        }
        else {
            alert('Your code is not correct')
        }

};
  const forgot_password = async () => {
    if (inputUser.trim() == '' || inputPassword.trim() == '' || inputCode.trim() == '') {
        alert('Username or password or code cannot be empty');
        return
    }
        const data = await update_password(inputUser.trim(), inputPassword.trim(),inputCode.trim() ); // Expecting { access_token, refresh_token }
        if (data) {
            alert('Your Password is updated and you are logged in')
            saveUsername(inputUser.trim())
        }
        else {
            alert('Your code is not correct')
        }

};
const PasswordInput = ({ value, onChangeText, placeholder }) => {
  const [secureText, setSecureText] = useState(true);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 }}>
      <TextInput
        style={{ flex: 1, height: 40 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureText}
      />
      <TouchableOpacity onPress={() => setSecureText(!secureText)}>
        {secureText ? <EyeOff size={20} /> : <Eye size={20} />}
      </TouchableOpacity>
    </View>
  );
};
  return (
  <ImageBackground
      source={require('../../assets/background.webp')}//
      style={common.background}
      resizeMode="cover" // Ensures the image covers the entire screen
    >
    {username &&
    (<View style={common.pickerRowUser}>
    <TouchableOpacity
                style={common.picker_button}
                onPress={logout}
              >
                <Text style={common.buttonText}>LOGOUT</Text>
              </TouchableOpacity>
     </View>)}
     {!username && (
    <View style={common.pickerRowUser}>
          <TouchableOpacity
            style={(actionType == "create") ? common.picker_button_selected : common.picker_button}
            onPress={() => setActionType("create")}
          >
            <Text style={common.buttonText}>CREATE USER</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={(actionType == "login") ? common.picker_button_selected : common.picker_button}
            onPress={() => setActionType("login")}
          >
            <Text style={common.buttonText}>LOGIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={(actionType == "forgot_password") ? common.picker_button_selected : common.picker_button}
              onPress={() => setActionType("forgot_password")}
            >
              <Text style={common.buttonText}>FORGOT PASSWORD</Text>
            </TouchableOpacity>
    </View>)}
    {actionType == "create" && !username &&
        (<View style={common.container_user}>

          <Text style={common.titleName}>Username:</Text>
          <TextInput
            style={common.inputUser}
            value={inputUser}
            onChangeText={setInputUser}
            placeholder="Enter Your Username"
          />
          <Text style={common.titleName}>Password:</Text>
            <TextInput
              style={common.inputUser}
              value={inputPassword}
              onChangeText={setInputPassword}
              placeholder="Enter Password"
              secureTextEntry={true}
            />
           <Text style={common.titleName}>Code:</Text>
              <TextInput
                style={common.inputUser}
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="Enter The Code"
              />
          <TouchableOpacity style={common.big_button} onPress={create_user}>
             <Text style={common.buttonText}>CREATE USER</Text>
          </TouchableOpacity>
        </View>)
        }
    {actionType == "login" && !username &&
    (<View style={common.container_user}>

      <Text style={common.titleName}>Username:</Text>
      <TextInput
        style={common.inputUser}
        value={inputUser}
        onChangeText={setInputUser}
        placeholder="Username"
      />
      <Text style={common.titleName}>Password:</Text>
        <TextInput
          style={common.inputUser}
          value={inputPassword}
          onChangeText={setInputPassword}
          placeholder="Password"
          secureTextEntry={true}
        />
      <TouchableOpacity style={common.big_button} onPress={login}>
         <Text style={common.buttonText}>LOGIN</Text>
      </TouchableOpacity>
    </View>)}
    {actionType == "forgot_password" && !username &&
        (<View style={common.container_user}>

          <Text style={common.titleName}>Username:</Text>
          <TextInput
            style={common.inputUser}
            value={inputUser}
            onChangeText={setInputUser}
            placeholder="Enter Your Username"
          />
          <Text style={common.titleName}>New Password:</Text>
            <TextInput
              style={common.inputUser}
              value={inputPassword}
              onChangeText={setInputPassword}
              placeholder="Enter New Password"
              secureTextEntry={true}
            />
           <Text style={common.titleName}>Code:</Text>
              <TextInput
                style={common.inputUser}
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="Enter The Code"
              />
          <TouchableOpacity style={common.big_button} onPress={forgot_password}>
             <Text style={common.buttonText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>
        </View>)
        }
    </ImageBackground>
  );
};


export default UsernameScreen;
