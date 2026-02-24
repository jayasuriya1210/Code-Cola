export default function Card({ children }) {
    return (
        <div
            style={{
                background: "white",
                padding: "20px",
                marginBottom: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
        >
            {children}
        </div>
    );
}