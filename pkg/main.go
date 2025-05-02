package main

import (
	"context"
	"encoding/json"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// Plugin instance settings
type PluginSettings struct {
	forecastingServer        string
	enableAlpha              bool
	appTlsSkipVerifyInsecure bool
}

// CallResourceHandler handles resource requests
type CallResourceHandler struct{}

// CallResource implements resource request handling
func (h *CallResourceHandler) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	// Check request path
	if req.Path == "config" {
		// Get configuration from environment variables or default values
		forecastingServer := getEnvOrDefault("GF_PLUGINS_FORECASTING_SERVER", "none")

		// Construct JSON response
		response := map[string]interface{}{
			"forecasting_server": forecastingServer,
		}

		jsonData, err := json.Marshal(response)
		// Send success response
		if err != nil {
			return sender.Send(&backend.CallResourceResponse{
				Status: 500,
				Body:   []byte("Internal Server Error"),
			})
		}
		// Send success response
		return sender.Send(&backend.CallResourceResponse{
			Status: 200,
			Body:   jsonData,
		})
	}

	// Path not found, return 404
	return sender.Send(&backend.CallResourceResponse{
		Status: 404,
		Body:   []byte("Resource not found"),
	})
}

// Get environment variable, return default value if not exists
func getEnvOrDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// Get environment variable and convert to boolean
func getEnvAsBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		if value == "1" || value == "true" || value == "TRUE" || value == "True" {
			return true
		}
		if value == "0" || value == "false" || value == "FALSE" || value == "False" {
			return false
		}
	}
	return defaultValue
}

func main() {
	// Start plugin and register CallResource handler
	err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: &CallResourceHandler{},
	})
	if err != nil {
		log.DefaultLogger.Error("Failed to start plugin", "error", err)
	}
}
