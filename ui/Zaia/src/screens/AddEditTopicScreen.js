import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList,  ScrollView, Alert } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Config from 'react-native-config';
import { useUser } from '../context/UserContext';
import {common} from "../styles"
import { update_topic, insert_topic } from '../services/APIService';


const frequencies = ['hourly', 'daily', 'weekly'];
const itemTypes = ['short summary', 'medium summary', 'long summary'];


const AddEditTopic = ({ route, navigation }) => {
  const { topic } = route.params || {};
  const { username } = useUser();
  const [topicName, setTopicName] = useState(topic?.topic_name || '');
  const [topicType, setTopicType] = useState(topic?.topic_type || 'web');
  const [frequency, setFrequency] = useState(topic?.frequency || frequencies[0]);
  const [items, setItems] = useState(topic?.items || []);
  const [extractionType, setExtractionType] = useState((topic?.is_multi_item ? 'extraction' :  'summary') || 'summary');
  const [summaryType, setSummaryType] = useState('short summary');

  const handleAddItem = () => {
    setItems([...items, { value_type: "text", num_values: 1,  item_type: "extract info"}]);
  };

  const handleItemChange = (index, key, value) => {
  if (value !=='')
  {
    var updatedItems = items.map((item, i) => (i === index ? { ...item, [key]: value} : item));

    setItems(updatedItems);
    }
  };

  const saveTopic = async () => {

    if (topicName  === "") {
          alert('Topic name cannot be empty')
          return;
    }


    var items_for_sending = items;

    if (extractionType=='summary') {
        items_for_sending =[{ value_type: "text", num_values: 1,  item_type: summaryType, item_name: summaryType}];
    }

    if (extractionType=='extraction') {
        items_for_sending = items.filter(item => "item_name" in item);
        }

    if (items_for_sending.length  === 0 && extractionType=='extraction') {
            alert('You need to add at least one item for extraction')
            return;
        }
    const is_multi_item = (extractionType=='extraction')


    if (topic)
        var payload = {
          id: topic.id,
          topic_name: topicName,
          topic_type: topicType,
          frequency: (topicType == "web" ? "once" : frequency),
          items: items_for_sending,
        };
    else
        payload = {
          user: username,
          topic_name: topicName,
          topic_type: topicType,
          frequency: (topicType == "web" ? "once" : frequency),
          items: items_for_sending,
          is_multi_item: is_multi_item
        };
    console.log(payload)
    try {
      const success = await (topic ? update_topic(payload) : insert_topic(payload));
      if (!success) throw new Error('Failed to save topic');
        else {
        topic ? alert('Topic is updated') :  alert('You are All set up!!! Wait for up to 5 min at check View Items of the Topic for extractions.');
//        alert(`Topic is ${topic ? 'updated' : 'created. \nWait for up to 5 min at check View Items of the Topic for extractions.'}`);
        }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={common.scrollViewContainer}>
    <Text style={[common.titleName, {"marginBottom": 20, "marginTop": 20 }]}>Tell us what you want? </Text>
      <Text style={common.titleName}>I would like to search for: </Text>

      <TextInput style={common.inputAddTopic} value={topicName} onChangeText={setTopicName} />

      <Text style={common.titleName}>From:</Text>
       <View style={common.pickerRow}>
             <TouchableOpacity
               style={(topicType == "web") ? common.picker_button_selected : common.picker_button}
               onPress={() => setTopicType("web")}
             >
               <Text style={common.buttonText}>WEB</Text>
             </TouchableOpacity>
             <TouchableOpacity
               style={(topicType == "news") ? common.picker_button_selected : common.picker_button}
               onPress={() => setTopicType("news")}
             >
               <Text style={common.buttonText}>NEWS</Text>
             </TouchableOpacity>
       </View>

{topicType==="news" &&
      (
      <View>
      <Text style={common.titleName}>Frequency</Text>
      <Text style={common.detailsText}>how often to check the news</Text>
      <Picker selectedValue={frequency} onValueChange={setFrequency} style={common.picker}>
        {frequencies.map((freq) => (
          <Picker.Item key={freq} label={freq} value={freq} />
        ))}
      </Picker>
      </View>)}


      <Text style={common.titleName}>In order to: </Text>
       <View style={common.pickerRow}>
             <TouchableOpacity
               style={(extractionType === "summary") ? common.picker_button_selected : common.picker_button}
               onPress={() => setExtractionType("summary")}
             >
               <Text style={common.buttonText}>TO SUMMARIZE</Text>
             </TouchableOpacity>
             <TouchableOpacity
               style={(extractionType === "extraction") ? common.picker_button_selected : common.picker_button}
               onPress={() => setExtractionType("extraction")}
             >
               <Text style={common.buttonText}>TO EXTRACT INFO</Text>
             </TouchableOpacity>
       </View>

        {extractionType==="summary" &&
          (
          <View>
          <Text style={common.titleName}>And the summary should be: </Text>
          <Picker selectedValue={itemTypes[0]} onValueChange={(value) => setSummaryType(value)} style={common.picker}>
            {itemTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
          </View>)}
    {extractionType=='extraction' && (

    <View>
    <Text style={common.titleName}>And get the following info:</Text>

     {items.map((item, index) => (
                   <View key={index} style={common.rowsContainer}>

                     <View>
                       <TextInput style={common.input} value={item.item_name} onChangeText={(value) => handleItemChange(index, 'item_name', value)} />

                   </View>

                   </View>
           ))}
    <TouchableOpacity style={common.big_button} onPress={handleAddItem}>
        <Text style={common.buttonText}>+ Add</Text>
      </TouchableOpacity>
    </View>)}




      <TouchableOpacity style={common.big_button} onPress={saveTopic}>
        <Text style={common.buttonText}>SAVE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddEditTopic;

