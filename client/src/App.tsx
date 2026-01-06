import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DataManagement from '@/components/DataManagement/DataManagement'
import ForgeDashboard from '@/components/Forge/ForgeDashboard'
import Results from '@/components/Results/Results'

function App() {
  const [activeTab, setActiveTab] = useState('data')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold">Atlas Forge</h1>
          <p className="text-muted-foreground">Multi-Indicator Branch Generation & Backtesting</p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="forge">Forge</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="mt-6">
            <DataManagement />
          </TabsContent>

          <TabsContent value="forge" className="mt-6">
            <ForgeDashboard />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Results />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
