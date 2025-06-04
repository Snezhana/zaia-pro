import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, ImageBackground } from "react-native";
import {common} from "../styles"

const HomeScreen = ({ onNavigateToUser, onNavigateToTopics, onNavigateToTasks, onNavigateToCommented, onNavigateToJournal }) => (
  <ImageBackground
    source={require('../../assets/background.webp')}//
    style={common.background}
    resizeMode="cover" // Ensures the image covers the entire screen
  >
    <View style={common.container_home}>
      <TouchableOpacity style={common.big_button} onPress={onNavigateToUser}>
        <Text style={common.buttonText}>User</Text>
      </TouchableOpacity>
      <TouchableOpacity style={common.big_button} onPress={onNavigateToTopics}>
        <Text style={common.buttonText}>Topics</Text>
      </TouchableOpacity>
      <TouchableOpacity style={common.big_button} onPress={onNavigateToTasks}>
        <Text style={common.buttonText}>Marked</Text>
      </TouchableOpacity>
    <TouchableOpacity style={common.big_button} onPress={onNavigateToCommented}>
      <Text style={common.buttonText}>Comments</Text>
    </TouchableOpacity>
    <TouchableOpacity style={common.big_button} onPress={onNavigateToJournal}>
      <Text style={common.buttonText}>Journal</Text>
    </TouchableOpacity>
    </View>
  </ImageBackground>
);

export default HomeScreen;
