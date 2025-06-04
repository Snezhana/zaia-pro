import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity, Text, View, Button } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import UserScreen from "../screens/UserScreen";
import TopicsScreen from "../screens/TopicsScreen";
import ItemsScreen from "../screens/ItemsScreen";
import ItemDetailsScreen from "../screens/ItemDetailsScreen";
import AddEditTopicScreen from "../screens/AddEditTopicScreen";
import MultiItemScreen from "../screens/MultiItemsScreen";
import TrackingScreen from "../screens/TrackingScreen";
import {common, colors} from "../styles";
import JournalHistoryScreen from  "../screens/JournalHistoryScreen";


const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreenWrapper}
        options={{
          headerTitle: () => (
          <Text style={common.header_text}>
            zAIa.pro
          </Text>
        ),

          headerStyle: common.headerStyle,
          headerTintColor: colors.headerTintColor,
          headerTitleStyle: common.headerTitleStyle,
        }}
      />

      <Stack.Screen
        name="Topics"
        component={TopicsScreenWrapper}
          options={{
              headerTitle: () => (
                <Text style={common.header_text}>
                  TOPICS
                </Text>
              ),

                headerStyle: common.headerStyle,
                headerTintColor: colors.headerTintColor,
                headerTitleStyle: common.headerTitleStyle,
          }}
      />
      <Stack.Screen name="Items" component={ItemsScreen}
        options={{
             headerTitle: () => (
             <Text style={common.header_text}>
               ITEMS
             </Text>
           ),

             headerStyle: common.headerStyle,
             headerTintColor: colors.headerTintColor,
             headerTitleStyle: common.headerTitleStyle,
              }}/>
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={{
         headerTitle: () => (
          <Text style={common.header_text}>
            ITEMS DETAILS
          </Text>
         ),

          headerStyle: common.headerStyle,
          headerTintColor: colors.headerTintColor,
          headerTitleStyle: common.headerTitleStyle,
        }}
      />
      <Stack.Screen
              name="User"
              component={UserScreen}
              options={{
         headerTitle: () => (
          <Text style={common.header_text}>
            USER
          </Text>
         ),

          headerStyle: common.headerStyle,
          headerTintColor: colors.headerTintColor,
          headerTitleStyle: common.headerTitleStyle,
              }}
            />

          <Stack.Screen
                       name="AddEditTopic"
                       component={AddEditTopicScreen}
                       options={{
         headerTitle: () => (
          <Text style={common.header_text}>
            ADD/EDIT TOPIC
          </Text>
         ),

          headerStyle: common.headerStyle,
          headerTintColor: colors.headerTintColor,
          headerTitleStyle: common.headerTitleStyle,
                       }}
                     />
          <Stack.Screen
             name="MultiItems"
             component={MultiItemScreen}
             options={{
               headerTitle: () => (
                <Text style={common.header_text}>
                  ITEMS
                </Text>
               ),

                headerStyle: common.headerStyle,
                headerTintColor: colors.headerTintColor,
                headerTitleStyle: common.headerTitleStyle,
             }}
           />
          <Stack.Screen
             name="Tracking"
             component={TrackingScreen}
             options={{
               headerTitle: () => (
                <Text style={common.header_text}>
                  YOUR JOURNAL
                </Text>
               ),

                headerStyle: common.headerStyle,
                headerTintColor: colors.headerTintColor,
                headerTitleStyle: common.headerTitleStyle,
             }}
           />
          <Stack.Screen
             name="JournalHistory"
             component={JournalHistoryScreen}
             options={{
               headerTitle: () => (
                <Text style={common.header_text}>
                  JOURNAL HISTORY
                </Text>
               ),

                headerStyle: common.headerStyle,
                headerTintColor: colors.headerTintColor,
                headerTitleStyle: common.headerTitleStyle,
             }}
           />
    </Stack.Navigator>
  </NavigationContainer>
);


const HomeScreenWrapper = ({ navigation }) => (
  <HomeScreen
    onNavigateToUser={() => navigation.navigate("User")}
    onNavigateToTopics={() => navigation.navigate("Topics")}
    onNavigateToTasks={() => navigation.navigate("Items", { for_reading: true, topic_name: "Marked for reading" })}
    onNavigateToCommented={() => navigation.navigate("Items", {  topic_name: "Commented items", only_with_comments : true })}
    onNavigateToJournal={() => navigation.navigate("Tracking")}
  />
);


const TopicsScreenWrapper = ({ navigation }) => (
  <TopicsScreen
    onTopicSelect={(topicId, topic_name, multi_item) => {
      if (multi_item) {
        navigation.navigate("MultiItems", { topicId, topic_name });
      } else {
        navigation.navigate("Items", { topicId, topic_name });
      }
    }}
  />
);

export default AppNavigator;
