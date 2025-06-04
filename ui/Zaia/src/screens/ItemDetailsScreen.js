import React from 'react';
import { ScrollView, Text, Linking, TouchableOpacity } from 'react-native';
import {common} from "../styles"

const ItemDetailsScreen = ({ route }) => {
  const { item } = route.params;

  return (
    <ScrollView style={common.scrollViewContainer}>
      <Text style={common.titleName}>{item.title}</Text>
      <TouchableOpacity style={common.row_button} onPress={() => Linking.openURL(item.source)}>
        <Text style={common.buttonText}>Open Source</Text>
      </TouchableOpacity>
      <Text style={common.summaryText}>Summary: {item.value}</Text>

    </ScrollView>
  );
};


export default ItemDetailsScreen;
