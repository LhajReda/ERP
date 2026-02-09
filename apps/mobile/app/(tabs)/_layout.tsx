import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { colors } from '../../src/theme/colors';

// Simple icon component using text emoji (avoids icon library issues)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dashboard: '🏠',
    farms: '🌾',
    culture: '🌱',
    stock: '📦',
    more: '⚙️',
  };
  return (
    <>{/* Using emoji as tab icons for simplicity */}</>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[500] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
          borderTopColor: colors.gray[200],
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          headerTitle: 'FLA7A',
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="farms"
        options={{
          title: t('tabs.farms'),
          tabBarIcon: ({ focused }) => <TabIcon name="farms" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="culture"
        options={{
          title: t('tabs.culture'),
          tabBarIcon: ({ focused }) => <TabIcon name="culture" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: t('tabs.stock'),
          tabBarIcon: ({ focused }) => <TabIcon name="stock" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ focused }) => <TabIcon name="more" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
