const PeopleList = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    const [peopleEntries, setPeopleEntries] = React.useState('');

    // Effect to handle updates from the game engine
    React.useEffect(() => {
        // Create a function that the game engine can call to update entries
        window.updatePeopleListEntries = (newEntries) => {
            setPeopleEntries(newEntries);
        };

        return () => {
            // Cleanup
            delete window.updatePeopleListEntries;
        };
    }, []);

    return (
        <div className={`peopleList ${isCollapsed ? 'collapsed' : ''}`}>
            <button 
                className="togglePeopleList"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                Toggle People List
            </button>
            <div 
                id="peopleEntries"
                dangerouslySetInnerHTML={{ __html: peopleEntries }}
            />
        </div>
    );
};

// Mount the component
const rootElement = document.getElementById('react-people-list');
const root = ReactDOM.createRoot(rootElement);
root.render(<PeopleList />);
