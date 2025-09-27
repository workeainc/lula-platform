import React, { useCallback, useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { PieChart } from 'react-native-chart-kit'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import BackendService from '../services/BackendService'
import NewAuthService from '../services/NewAuthService'
import { useSelector } from 'react-redux'
import { handleError } from '../utils/function'

const { width } = Dimensions.get('window')

export default function Analytics() {
    const { user } = useSelector((state) => state.auth)
    const navigation = useNavigation()
    const [pieData, setPieData] = useState([])
    const [states, setStates] = useState(null)
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [totalWithdrawn, setTotalWithdrawn] = useState(0)
    const [totalWithdrawnProcessAmount, setWithdrawnProcessAmount] = useState(0)

    // Fetch user profile data
    const fetchUserData = async () => {
        try {
            setIsLoading(true)
            const res = await AuthService.getUser(user.id)
            if (!res.error) {
                setUserData(res.user)
            }
        } catch (error) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch analytics data
    const fetchData = async () => {
        try {
            const res = await HomeService.getLastFourWeeksEarnings(user.id)
            const statesCounts = await HomeService.getHomeCounts(user.id)
            const withdrawnAmount = await HomeService.getTotalWithdrawnAmount(user.id)
            const withdrawnProcessAmount = await HomeService.getProcessWithdrawnAmount(user.id)

            setStates(statesCounts.data)
            setPieData(res)
            setTotalWithdrawn(withdrawnAmount)
            setWithdrawnProcessAmount(withdrawnProcessAmount)
        } catch (error) {
            handleError(error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchUserData()
            fetchData()
        }, [])
    )

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['rgba(171, 73, 161, 0.9)', 'rgba(97, 86, 226, 0.9)']} style={styles.gradient}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity onPress={() => navigation.navigate('StreamerProfile')}>
                            <Image
                                source={
                                    userData?.profileUri && typeof userData.profileUri === 'string' && userData.profileUri.trim() !== ''
                                        ? { uri: userData.profileUri }
                                        : require('../assets/images/avatar.png') // Fallback image
                                }
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Growth metrics */}
                    <View style={styles.metricsContainer}>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Followers</Text>
                            </View>
                            <Text style={styles.metricValue}>{states?.followers ?? 'N/A'}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Following</Text>
                            </View>
                            <Text style={styles.metricValue}>{states?.following ?? 'N/A'}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Chats</Text>
                            </View>
                            <Text style={styles.metricValue}>{states?.chats ?? 'N/A'}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Minutes Talked</Text>
                            </View>
                            <Text style={styles.metricValue}>00</Text>
                        </View>
                        <View style={styles.metricCard2}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Total Earnings</Text>
                            </View>
                            <Text style={styles.metricValue}>{states?.totalEarnings ?? 0} Coins</Text>
                        </View>
                        <View style={styles.metricCard2}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Earnings Avalible In Wallet</Text>
                            </View>
                            <Text style={styles.metricValue}>{((states?.totalEarnings || 0) - (totalWithdrawn || 0)).toFixed(2)} Coins</Text>
                        </View>
                        <View style={styles.metricCard2}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Total Withdrawn</Text>
                            </View>
                            <Text style={styles.metricValue}>{totalWithdrawn ?? 0} Coins</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Withdraw')} style={styles.videoTextDiv}>
                                <LinearGradient colors={['#57A10D', '#57A10D']} className="w-20 py-1 rounded-md">
                                    <Text style={styles.videoText} className="text-center">Withdraw</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.metricCard2}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricTitle}>Withdrawn In Process</Text>
                            </View>
                            <Text style={styles.metricValue}>{totalWithdrawnProcessAmount} Coins</Text>
                        </View>
                    </View>

                    {/* Device distribution */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartTitle}>Month Overview</Text>
                                <Text style={styles.chartSubtitle}>Your Current month revenue.</Text>
                            </View>
                        </View>
                        <View style={styles.pieChartContainer}>
                            <PieChart
                                data={pieData}
                                width={width - 50}
                                height={180}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        </View>
                    </View>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginRight: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 25,
        paddingHorizontal: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    periodButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: '#6156e2',
    },
    periodButtonText: {
        color: '#666',
        fontWeight: '500',
        fontSize: 13,
    },
    periodButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    metricsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 7,
        width: '48%',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    metricCard2: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        width: '100%',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EEE',
        position: 'relative',
    },
    videoTextDiv: {
        position: 'absolute',
        right: 15,
        bottom: 15,
    },
    videoText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 3,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    metricTitle: {
        color: '#666',
        fontSize: 14,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    metricGrowth: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricGrowthText: {
        fontSize: 13,
        fontWeight: '600',
        marginRight: 5,
    },
    metricPeriod: {
        fontSize: 12,
        color: '#999',
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    chartSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    chartIcon: {
        backgroundColor: 'rgba(97, 86, 226, 0.1)',
        padding: 8,
        borderRadius: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    sectionHeader: {
        marginTop: 10,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    pieChartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    demographicsContainer: {
        marginTop: 10,
    },
    demographicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    demographicAge: {
        width: 50,
        fontSize: 14,
        color: '#666',
    },
    demographicBarContainer: {
        flex: 1,
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginHorizontal: 10,
    },
    demographicBar: {
        height: 10,
        backgroundColor: '#6156e2',
        borderRadius: 5,
    },
    demographicPercentage: {
        width: 40,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'right',
    },
    contentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    contentInfo: {
        flex: 1,
    },
    contentTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 5,
    },
    contentViews: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentIcon: {
        marginRight: 5,
    },
    contentViewsText: {
        fontSize: 13,
        color: '#888',
    },
    contentGrowth: {
        marginLeft: 10,
    },
    contentGrowthText: {
        fontSize: 14,
        fontWeight: '600',
    },
    recommendationsCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    recommendationsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    recommendation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    recommendationIcon: {
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 10,
        marginRight: 12,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
})
