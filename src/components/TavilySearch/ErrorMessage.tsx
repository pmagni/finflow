interface ErrorMessageProps {
  error: string;
}

const ErrorMessage = ({ error }: ErrorMessageProps) => (
  <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
    Error: {error}
  </div>
);

export default ErrorMessage; 