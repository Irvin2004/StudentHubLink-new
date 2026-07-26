import { Component } from "react";

import ErrorFallback from "./ErrorFallback.jsx";

export default class ErrorBoundary extends Component {
    state = {
        error: null,
        hasError: false
    };

    static getDerivedStateFromError(error) {
        return {
            error,
            hasError: true
        };
    }

    componentDidCatch(error, errorInfo) {
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    homeUrl={this.props.homeUrl}
                    onReload={this.props.onReload}
                />
            );
        }

        return this.props.children;
    }
}
