import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SIZES } from '../constants'

const NoInternet = () => {
    return (
        <View style={{ height: SIZES.height, justifyContent: 'center', alignItems: 'center' }}>
            <Text>NoInternet</Text>
        </View>
    )
}

export default NoInternet

const styles = StyleSheet.create({})
