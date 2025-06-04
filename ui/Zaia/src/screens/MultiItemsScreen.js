import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity , SafeAreaView, Alert, ImageBackground, TextInput, Linking } from 'react-native';
import Config from 'react-native-config';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import {common, colors} from "../styles";
import { fetchMultiItem, deleteMultiItem } from '../services/APIService';


const MultiItems = ({route})  => {
  const [multiItems, setMultiItems] = useState([]);
  const [perExtractedItem, setPerExtractedItem] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState(null);
  const [isPerItem, setIsPerItem] = useState(false);
  const { topicId, for_reading, topic_name } = route.params || {};
  const { username } = useUser();


  useEffect(() => {
        fetchData(topicId, searchTerm);
  }, []);

  const fetchData = async  (topicId, search_term) => {
    setLoading(true);
    setError(null);
    try {
        const data = await fetchMultiItem(topicId, search_term, username);
        if (data.length > 0) {
            setMultiItems(data);
            setPerExtractedItem(getValuePerExtractedItems(data))
            setLoading(false);
          } else {
            setError('There are no items here');
            setMultiItems(data);
            setPerExtractedItem(getValuePerExtractedItems(data))
            setLoading(false);
          }
      }
    catch {
        alert('Error during fetching items');
        setLoading(false);
    }

  };

    const getValuePerExtractedItems = (items) => {
        const groupedItems = {};

        items.forEach(entry => {
          entry.items.forEach(item => {
            const { item_name, value } = item;

            if (!groupedItems[item_name]) {
              groupedItems[item_name] = {
                item_name,
                values: []
              };
            }

            groupedItems[item_name].values.push({
              value,
              url: entry.source,
              title: entry.title,
              created_on: entry.created_on,
              modified_on: entry.modified_on,
              done: entry.done
            });
          });
        });

        return Object.values(groupedItems);
      };


    const deleteItem = async (id) => {
        try {
          const success = await deleteMultiItem(id);
          if (success) {
            fetchData(topicId, searchTerm);

          } else {
            alert("Failed to delete.");
          }
        } catch (error) {
          alert("Failed to delete");
          console.error(error);
        }
      };

  const confirmDelete = (id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Deletion cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteItem(id),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };
    const switchPresentation = () => {
        setIsPerItem(!isPerItem)
      };
  const handleSearch = () => {
    fetchData(topicId, searchTerm, for_reading);
  }

  const renderPerTitle = ({ item }) => (
    <View style={common.rowsContainer}>
      <Text style={common.topicName}>{item.title}</Text>
      <Text style={common.subtitleName}>{Intl.DateTimeFormat("en-US", {
                                                 year: "numeric",
                                                 month: "numeric",
                                                 day: "numeric",
                                                 hour: "2-digit",
                                                 minute: "2-digit",

                                               }).format(new Date(item.created_on * 1000))}</Text>
      {item.items && item.items.map((subItem, index) => (
        <View key={index} style={common.insideRowContainer}>
          <Text style={common.subtitleName}>• {subItem.item_name}: {subItem.value}</Text>
        </View>
      ))}
      <View style={common.buttonContainer}>
           <TouchableOpacity style={common.row_button} onPress={() => Linking.openURL(item.source)}>
             <Text style={common.rowButtonText}>Source</Text>
           </TouchableOpacity>
          <TouchableOpacity style={common.delete_button}
              onPress={() => confirmDelete(item.id)}>
              <Text style={common.buttonText}>Delete</Text>
          </TouchableOpacity>
            </View>
    </View>
  );
  const renderPerExtractedItem = ({ item }) => (
    <View style={common.rowsContainer}>
       <Text style={common.topicName}>{item.item_name}</Text>

       {item.values && item.values.length > 0 && (
         <View style={common.tableContainer}>

           {/* Table Rows */}
           {item.values.map((subItem, index) => (
             <View key={index} style={common.tableRow}>
               <Text style={[common.tableCell, { flex: 1 }]}>{subItem.title}</Text>
               <Text style={[common.tableCell, { flex: 1 }]}>{subItem.value}</Text>
             </View>
           ))}
         </View>
       )}
     </View>
   );
  if (loading) {
    return (
      <View style={common.centered}>
        <ActivityIndicator size="large" color={colors.button_dark_text} />
        <Text>Loading Items...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background.webp')}//
      style={common.background}
      resizeMode="cover" // Ensures the image covers the entire screen
    >
  <SafeAreaView style={common.items_container}>
    {error && (<View style={common.container_user}>
                       <Text style={common.errorText}>{error}</Text>
                     </View>)}
    <View style={common.headerTopicName}>
        <Text style={common.topicTitleInHeader}> {topic_name}</Text>
    </View>
      <View style={common.search_header}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor = {colors.placeholderTextColor}
          style={common.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={common.middle_button} onPress={handleSearch}>
          <Text style={common.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={common.middle_button}
            onPress={switchPresentation}>
          <Text style={common.buttonText}>{isPerItem ? 'Per Title' : 'Per Item'}</Text>
        </TouchableOpacity>

      </View>
      {isPerItem ?
    (<FlatList
      data={perExtractedItem}
      keyExtractor={(item) => item.item_name}
      renderItem={renderPerExtractedItem}
    />) :
    (<FlatList
      data={multiItems}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderPerTitle}
        />)
    }

        </SafeAreaView>
        </ImageBackground>
  );
};

export default MultiItems;
