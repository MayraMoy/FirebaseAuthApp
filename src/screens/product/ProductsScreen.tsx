import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProductsScreen() {
  return (
    <View style={styles.container}>
      <Text>Pantalla de Productos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
