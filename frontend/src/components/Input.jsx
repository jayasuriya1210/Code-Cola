export default function Input({ placeholder, type = "text", onChange }) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            onChange={onChange}
            style={{
                padding: "8px",
                width: "250px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc"
            }}
        />
    );
}
